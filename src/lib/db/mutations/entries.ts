"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { EntryTable, UserUploadTable } from "@/lib/db/schema";
import { entryDetailTag, entryListTag } from "@/lib/entries/tags";
import { action, type ActionState } from "@/lib/utils";

const createEntrySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    birthDate: z.coerce.date(),
    deathDate: z.coerce.date(),
    causeOfDeath: z.string().max(240).optional().or(z.literal("")),
    location: z.string().max(240).optional().or(z.literal("")),
    primaryImageUrl: z
      .string()
      .min(1, "Profile image is required")
      .url("Profile image is required"),
    primaryImageKey: z.string().min(1, "Profile image upload failed"),
  })
  .refine(
    (data) => data.deathDate >= data.birthDate,
    "Date of death must be after the date of birth"
  );

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const ensureUniqueSlug = async (name: string) => {
  const base = slugify(name) || "entry";
  let slug = base;
  let attempt = 1;

  while (true) {
    const existing = await db.query.EntryTable.findFirst({
      where: eq(EntryTable.slug, slug),
      columns: { id: true },
    });

    if (!existing) {
      return slug;
    }

    attempt += 1;
    slug = `${base}-${attempt}`;
  }
};

const success = (message: string, data: Record<string, unknown> = {}) => ({
  success: message,
  ...data,
});

const failure = (message: string): ActionState => ({
  error: message,
});

export const createEntry = action(createEntrySchema, async (input) => {
  const { userId } = await auth();

  if (!userId) {
    return failure("You must be signed in to create an entry");
  }

  const slug = await ensureUniqueSlug(input.name);
  const birthDate = input.birthDate.toISOString().split("T")[0];
  const deathDate = input.deathDate.toISOString().split("T")[0];

  try {
    const entry = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(EntryTable)
        .values({
          ownerId: userId,
          name: input.name,
          slug,
          birthDate,
          deathDate,
          causeOfDeath: input.causeOfDeath || null,
          location: input.location || null,
          primaryImageUrl: input.primaryImageUrl,
        })
        .returning();

      const createdEntry = inserted[0];

      if (!createdEntry) {
        throw new Error("Failed to create entry");
      }

      const uploads = await tx
        .insert(UserUploadTable)
        .values({
          userId,
          entryId: createdEntry.id,
          url: input.primaryImageUrl,
          key: input.primaryImageKey,
          isPrimary: true,
        })
        .returning();

      const primaryUpload = uploads[0];

      if (!primaryUpload) {
        throw new Error("Failed to record upload");
      }

      await tx
        .update(EntryTable)
        .set({ updatedAt: new Date() })
        .where(eq(EntryTable.id, createdEntry.id));

      return createdEntry;
    });

    revalidateTag(entryListTag(userId));
    revalidateTag(entryDetailTag(entry.id));

    return success("Entry created", { entryId: entry.id, slug: entry.slug });
  } catch (error) {
    console.error("Failed to create entry", error);
    return failure("Something went wrong while creating the entry");
  }
});

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { EntryTable, UserUploadTable } from "@/lib/db/schema";
import { entryDetailTag, entryListTag } from "@/lib/entries/tags";
import { unstable_cache } from "next/cache";

export type EntrySummary = {
  id: string;
  name: string;
  slug: string;
  birthDate: string;
  deathDate: string;
  causeOfDeath: string | null;
  location: string | null;
  primaryImageUrl: string | null;
  updatedAt: string;
};

const mapEntrySummary = (entry: {
  id: string;
  name: string;
  slug: string;
  birthDate: string | Date;
  deathDate: string | Date;
  causeOfDeath: string | null;
  location: string | null;
  primaryImageUrl: string | null;
  updatedAt: string | Date;
}): EntrySummary => ({
  id: entry.id,
  name: entry.name,
  slug: entry.slug,
  birthDate:
    entry.birthDate instanceof Date
      ? entry.birthDate.toISOString().split("T")[0]
      : entry.birthDate,
  deathDate:
    entry.deathDate instanceof Date
      ? entry.deathDate.toISOString().split("T")[0]
      : entry.deathDate,
  causeOfDeath: entry.causeOfDeath,
  location: entry.location,
  primaryImageUrl: entry.primaryImageUrl,
  updatedAt:
    entry.updatedAt instanceof Date
      ? entry.updatedAt.toISOString()
      : new Date(entry.updatedAt).toISOString(),
});

export const getEntriesForUser = async (
  userId: string
): Promise<EntrySummary[]> => {
  return unstable_cache(
    async () => {
      const entries = await db
        .select()
        .from(EntryTable)
        .where(eq(EntryTable.ownerId, userId))
        .orderBy(desc(EntryTable.updatedAt));

      return entries.map(mapEntrySummary);
    },
    ["entries-for-user", userId],
    { revalidate: 60, tags: [entryListTag(userId)] }
  )();
};

export type EntryDetailUpload = {
  id: string;
  url: string;
  key: string;
  isPrimary: boolean;
  createdAt: string;
};

export type EntryDetail = EntrySummary & {
  causeOfDeath: string | null;
  location: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  };
  uploads: EntryDetailUpload[];
};

export const getEntryDetail = async (
  entryId: string
): Promise<EntryDetail | null> => {
  return unstable_cache(
    async () => {
      const entry = await db.query.EntryTable.findFirst({
        where: eq(EntryTable.id, entryId),
        with: {
          owner: true,
          uploads: {
            orderBy: [desc(UserUploadTable.isPrimary), desc(UserUploadTable.createdAt)],
          },
        },
      });

      if (!entry) {
        return null;
      }

      const summary = mapEntrySummary(entry);

      return {
        ...summary,
        createdAt:
          entry.createdAt instanceof Date
            ? entry.createdAt.toISOString()
            : new Date(entry.createdAt).toISOString(),
        owner: {
          id: entry.owner?.id ?? "",
          name: entry.owner?.name ?? null,
          email: entry.owner?.email ?? "",
          imageUrl: entry.owner?.imageUrl ?? null,
        },
        uploads:
          entry.uploads?.map((upload) => ({
            id: upload.id,
            url: upload.url,
            key: upload.key,
            isPrimary: upload.isPrimary,
            createdAt:
              upload.createdAt instanceof Date
                ? upload.createdAt.toISOString()
                : new Date(upload.createdAt).toISOString(),
          })) ?? [],
      } satisfies EntryDetail;
    },
    ["entry-detail", entryId],
    { revalidate: 30, tags: [entryDetailTag(entryId)] }
  )();
};

export const countUploadsForEntry = async (entryId: string) => {
  const result = await db
    .select({ value: sql<number>`count(*)` })
    .from(UserUploadTable)
    .where(eq(UserUploadTable.entryId, entryId));

  return result[0]?.value ?? 0;
};

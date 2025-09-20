import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { db } from "@/lib/db";
import { EntryTable, UserUploadTable } from "@/lib/db/schema";
import { countUploadsForEntry } from "@/lib/db/queries/entries";
import { entryDetailTag, entryListTag } from "@/lib/entries/tags";

type UploadMetadata = {
  userId: string;
  entryId?: string;
};

type UploadedFile = {
  url: string;
  key: string;
};

const f = createUploadthing();
const MAX_UPLOADS = 8;

export const uploadRouter = {
  entryProfileImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: UploadMetadata; file: UploadedFile }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        key: file.key,
      };
    }),
  entryGalleryImage: f({ image: { maxFileSize: "4MB" } })
    .input(z.object({ entryId: z.string().uuid() }))
    .middleware(async ({ input }: { input: { entryId: string } }) => {
      const { userId } = await auth();
      if (!userId) {
        throw new UploadThingError("Unauthorized");
      }

      const entry = await db.query.EntryTable.findFirst({
        where: and(eq(EntryTable.id, input.entryId), eq(EntryTable.ownerId, userId)),
        columns: { id: true },
      });

      if (!entry) {
        throw new UploadThingError("Entry not found");
      }

      const uploadCount = await countUploadsForEntry(input.entryId);
      if (uploadCount >= MAX_UPLOADS) {
        throw new UploadThingError("Image limit reached for this entry");
      }

      return { userId, entryId: input.entryId };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: UploadMetadata & { entryId: string }; file: UploadedFile }) => {
      const inserted = await db
        .insert(UserUploadTable)
        .values({
          entryId: metadata.entryId,
          userId: metadata.userId,
          url: file.url,
          key: file.key,
          isPrimary: false,
        })
        .returning();

      const upload = inserted[0];

      if (!upload) {
        throw new UploadThingError("Failed to save upload");
      }

      await db
        .update(EntryTable)
        .set({ updatedAt: new Date() })
        .where(eq(EntryTable.id, metadata.entryId));

      revalidateTag(entryDetailTag(metadata.entryId));
      revalidateTag(entryListTag(metadata.userId));

      return { url: upload.url, id: upload.id };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;

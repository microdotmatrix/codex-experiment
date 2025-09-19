"use server";

import { db } from "@/lib/db";
import { PostTable } from "@/lib/db/schema";
import { revalidateTag } from "next/cache";

export const createPost = async (title: string, content: string) => {
  await db.insert(PostTable).values({ title, content });

  revalidateTag("posts");
};

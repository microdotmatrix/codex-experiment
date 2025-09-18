import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { PostTable } from "@/lib/db/schema";

export const createPost = async (title: string, content: string) => {
  await db.insert(PostTable).values({ title, content });

  revalidateTag("posts");
};

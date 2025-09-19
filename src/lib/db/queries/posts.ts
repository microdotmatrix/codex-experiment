import { db } from "@/lib/db";
import { PostTable } from "@/lib/db/schema";

export const getPosts = async () => {
  return await db.select().from(PostTable);
};

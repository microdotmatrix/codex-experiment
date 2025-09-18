import { db } from "@/lib/db";
import { PostTable } from "@/lib/db/schema";

export const getPosts = async () => {
  "use cache";

  return await db.select().from(PostTable);
};

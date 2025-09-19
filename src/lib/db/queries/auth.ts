import { db } from "@/lib/db";
import { UserTable } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export const getCurrentUser = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  try {
    return {
      success: true,
      user: await getUserById(userId)
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not fetch user"
    };
  }
};

const getUserById = async (userId: string) => {
  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
  });
};
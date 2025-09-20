import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BASE_URL: z.string().min(1),
    UPLOADTHING_APP_ID: z.string().min(1),
    UPLOADTHING_SECRET: z.string().min(1),
  },
  createFinalSchema: (env) => {
    return z.object(env).transform((val) => {
      const { DATABASE_URL, BASE_URL, UPLOADTHING_APP_ID, UPLOADTHING_SECRET, ...rest } = val;
      return {
        DATABASE_URL,
        BASE_URL,
        UPLOADTHING_APP_ID,
        UPLOADTHING_SECRET,
        ...rest,
      };
    });
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BASE_URL: process.env.BASE_URL,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
  },
});

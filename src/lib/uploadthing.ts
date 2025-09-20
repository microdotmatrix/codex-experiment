import { generateReactHelpers } from "@uploadthing/react";

import type { AppFileRouter } from "@/app/api/uploadthing/core";

export const { UploadButton, UploadDropzone, useUploadThing } =
  generateReactHelpers<AppFileRouter>();

declare module "uploadthing/next" {
  export type FileRouter = Record<string, unknown>;
  export function createUploadthing(): any;
  export function createRouteHandler(config: {
    router: FileRouter;
  }): {
    GET: unknown;
    POST: unknown;
  };
}

declare module "uploadthing/server" {
  export class UploadThingError extends Error {
    constructor(message?: string);
  }
}

declare module "@uploadthing/react" {
  export function generateReactHelpers<TFileRouter>(): {
    UploadButton: (props: any) => JSX.Element;
    UploadDropzone: (props: any) => JSX.Element;
    useUploadThing: (...args: any[]) => any;
  };
}

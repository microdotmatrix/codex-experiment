import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { CreateDocumentForm } from "@/components/documents/create-document-form";
import { DocumentCard } from "@/components/documents/document-card";
import { buttonVariants } from "@/components/ui/button";
import { upsertUser } from "@/lib/db/mutations/auth";
import { getDocumentsForUser } from "@/lib/db/queries/documents";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="grid h-full place-items-center px-6">
        <article className="max-w-lg space-y-6 text-center">
          <h1 className="text-4xl font-semibold">Access denied</h1>
          <p className="text-muted-foreground">
            You need an active session to enter the workspace. Please
            authenticate and we&apos;ll drop you back here immediately.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link className={buttonVariants()} href="/sign-in">
              Sign in
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/sign-up">
              Create account
            </Link>
          </div>
        </article>
      </main>
    );
  }

  await upsertUser(userId);

  const documents = await getDocumentsForUser(userId);

  return (
    <main className="mx-auto flex w-full flex-col gap-10 px-4 pb-16 pt-10 md:px-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">
          Quantum drafting lab
        </p>
        <h1 className="text-2xl font-semibold md:text-3xl">
          Launch, evolve, and share living Markdown intelligence.
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Create documents that feel conversational yet precise. Invite
          collaborators to annotate, propose revisions, and keep a verified
          trail of what changed.
        </p>
      </section>

      <CreateDocumentForm />

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Active documents</h2>
          <span className="text-sm text-muted-foreground">
            {documents.length} {documents.length === 1 ? "workspace" : "workspaces"}
          </span>
        </header>
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-10 text-center text-sm text-muted-foreground">
            No documents yet. Spin up a new canvas above and start drafting.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                viewerId={userId}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

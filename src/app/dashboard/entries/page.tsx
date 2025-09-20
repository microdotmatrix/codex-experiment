import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CreateEntryForm } from "@/components/entries/create-entry-form";
import { EntryCard } from "@/components/entries/entry-card";
import { buttonVariants } from "@/components/ui/button";
import { upsertUser } from "@/lib/db/mutations/auth";
import { getEntriesForUser } from "@/lib/db/queries/entries";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function EntriesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard/entries");
  }

  await upsertUser(userId);

  const entries = await getEntriesForUser(userId);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 md:px-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Memorial archive</p>
        <h1 className="text-2xl font-semibold md:text-3xl">Create and curate remembrance entries.</h1>
        <p className="max-w-3xl text-muted-foreground">
          Each entry captures the story of a life well lived. Start with core biographical details and a primary portrait. You can
          expand the gallery with up to eight images at any time.
        </p>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "ghost" }), "h-9 w-fit px-3 text-sm")}
        >
          Back to documents
        </Link>
      </section>

      <section className="max-w-2xl">
        <CreateEntryForm />
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your entries</h2>
          <span className="text-sm text-muted-foreground">{entries.length} total</span>
        </header>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-10 text-center text-sm text-muted-foreground">
            No entries yet. Use the form above to begin documenting the lives you want to honor.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { EntryProfile } from "@/components/entries/entry-profile";
import { getEntryDetail } from "@/lib/db/queries/entries";

interface EntryDetailPageProps {
  params: { entryId: string };
}

export default async function EntryDetailPage({ params }: EntryDetailPageProps) {
  const { entryId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/dashboard/entries/${entryId}`);
  }

  const entry = await getEntryDetail(entryId);

  if (!entry || entry.owner.id !== userId) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 md:px-8">
      <EntryProfile entry={entry} />
    </main>
  );
}

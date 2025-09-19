import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { acceptInvitation } from "@/lib/db/mutations/documents";
import { getInvitationByToken } from "@/lib/db/queries/documents";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const acceptInvitationAction = async (formData: FormData) => {
  "use server";
  await acceptInvitation({}, formData);
};

interface InvitePageProps {
  params: { token: string };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const { userId } = await auth();

  if (invitation.status === "accepted") {
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-3xl font-semibold">Invitation already accepted</h1>
        <p className="text-muted-foreground">
          This link has already been used. If you believe this is a mistake, ask the
          document owner to send another invite.
        </p>
        <a href="/dashboard" className={buttonVariants()}>
          Return to dashboard
        </a>
      </main>
    );
  }

  if (invitation.status === "expired" || invitation.status === "revoked") {
    return (
      <main className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-3xl font-semibold">Invitation unavailable</h1>
        <p className="text-muted-foreground">
          This invite link is no longer valid. Reach out to {invitation.document?.owner?.name ?? "the document owner"} for a fresh invitation.
        </p>
      </main>
    );
  }

  if (!userId) {
    redirect(`/sign-in?redirect_url=/invite/${token}`);
  }

  return (
    <main className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Collaboration request
        </p>
        <h1 className="text-3xl font-semibold">
          Join <span className="text-primary">{invitation.document?.title ?? "this workspace"}</span>
        </h1>
        <p className="text-muted-foreground">
          {invitation.document?.owner?.name ?? invitation.document?.owner?.email ?? "A teammate"} invited you to collaborate on this document.
        </p>
      </div>
      <form action={acceptInvitationAction} className="flex flex-col items-center gap-4">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className={cn(buttonVariants(), "min-w-[200px]")}>Accept invitation</button>
      </form>
      <a href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
        Back to dashboard
      </a>
    </main>
  );
}

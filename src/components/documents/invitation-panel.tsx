"use client";

import { useActionState, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Mail, Share2, UserMinus, UserPlus } from "lucide-react";

import {
  inviteCollaborator,
  removeCollaborator,
  revokeInvitation,
} from "@/lib/db/mutations/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { CollaboratorInfo, InvitationInfo } from "@/components/documents/types";
import type { ActionState } from "@/lib/utils";

interface InvitationPanelProps {
  documentId: string;
  invitations: InvitationInfo[];
  collaborators: CollaboratorInfo[];
  isOwner: boolean;
  baseUrl: string;
}

type InviteState = ActionState & {
  invitationId?: string;
  token?: string;
};

const initialInviteState: InviteState = {};

const inviteCollaboratorAction = inviteCollaborator as unknown as (
  state: InviteState,
  formData: FormData
) => Promise<InviteState>;

const revokeInvitationAction = revokeInvitation as unknown as (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

const removeCollaboratorAction = removeCollaborator as unknown as (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>;

export const InvitationPanel = ({
  documentId,
  invitations,
  collaborators,
  isOwner,
  baseUrl,
}: InvitationPanelProps) => {
  const [state, formAction, isPending] = useActionState<InviteState, FormData>(
    inviteCollaboratorAction,
    initialInviteState
  );

  const [transitioning, startTransition] = useTransition();

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(state.success);
      if (state.token && typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard
          .writeText(`${baseUrl}/invite/${state.token}`)
          .catch(() => {
            /* ignore clipboard errors */
          });
      }
    }
  }, [state, baseUrl]);

  const activeCollaborators = useMemo(
    () => collaborators.filter((collaborator) => collaborator.status === "active"),
    [collaborators]
  );

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending"
  );

  const handleRevoke = (invitationId: string) => {
    const formData = new FormData();
    formData.append("documentId", documentId);
    formData.append("invitationId", invitationId);
    startTransition(async () => {
      const result = await revokeInvitationAction({}, formData);
      if (result?.error) toast.error(result.error);
      if (result?.success) toast.success(result.success);
    });
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    const formData = new FormData();
    formData.append("documentId", documentId);
    formData.append("collaboratorId", collaboratorId);
    startTransition(async () => {
      const result = await removeCollaboratorAction({}, formData);
      if (result?.error) toast.error(result.error);
      if (result?.success) toast.success(result.success);
    });
  };

  const copyShareLink = (token: string) => {
    const url = `${baseUrl}/invite/${token}`;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard unavailable in this context");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Invite link copied"))
      .catch(() => toast.error("Unable to copy link"));
  };

  return (
    <motion.section
      layout
      className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow"
    >
      <header className="mb-4">
        <h2 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Access control
        </h2>
        <p className="text-xs text-muted-foreground">
          Share precision links and manage active collaborators.
        </p>
      </header>

      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="documentId" value={documentId} />
        <Label htmlFor="invite-email" className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Invite via email
        </Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="astro@team.dev"
            required
            disabled={!isOwner || isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={!isOwner || isPending} className="inline-flex items-center gap-2">
            <UserPlus className="size-4" /> Invite
          </Button>
        </div>
        {!isOwner && (
          <p className="text-xs text-muted-foreground">
            Only document owners can manage invitations.
          </p>
        )}
      </form>

      {activeCollaborators.length > 0 && (
        <section className="mt-6 space-y-3">
          <h3 className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Active collaborators
          </h3>
          <ul className="space-y-2 text-sm">
            {activeCollaborators.map((collaborator) => (
              <li
                key={collaborator.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/70 px-3 py-2"
              >
                <div>
                  <p className="font-medium">
                    {collaborator.user?.name ?? collaborator.user?.email ?? "Unknown"}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{collaborator.role}</Badge>
                    {collaborator.acceptedAt && (
                      <span>
                        Joined {new Date(collaborator.acceptedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    disabled={transitioning}
                    className="inline-flex items-center gap-2 text-destructive"
                  >
                    <UserMinus className="size-3.5" /> Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 space-y-3">
        <h3 className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Pending invitations
        </h3>
        {pendingInvitations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No pending invites. Generate one above to summon contributors.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {pendingInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-col gap-2 rounded-lg border border-dashed border-border/50 bg-background/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    <span>{invitation.email}</span>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Created {new Date(invitation.createdAt).toLocaleString()}</span>
                  {invitation.expiresAt && (
                    <span>Expires {new Date(invitation.expiresAt).toLocaleString()}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyShareLink(invitation.token)}
                    className="inline-flex items-center gap-2"
                  >
                    <Share2 className="size-3.5" /> Copy link
                  </Button>
                  {isOwner && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(invitation.id)}
                      disabled={transitioning}
                      className="inline-flex items-center gap-2 text-destructive"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.section>
  );
};

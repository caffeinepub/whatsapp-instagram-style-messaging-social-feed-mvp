import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { Check, Crown, Loader2, Plus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Group } from "../backend";
import ErrorState from "../components/states/ErrorState";
import LoadingState from "../components/states/LoadingState";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useGetPublicUserProfile,
  useGroupInvites,
  useMyGroups,
} from "../hooks/useQueries";
import CreateGroupDialog from "./CreateGroupDialog";

function InviteCard({ group }: { group: Group }) {
  const acceptInvite = useAcceptGroupInvite();
  const declineInvite = useDeclineGroupInvite();
  const { data: creatorProfile } = useGetPublicUserProfile(
    group.creator.toString(),
  );

  const handleAccept = async () => {
    try {
      await acceptInvite.mutateAsync(group.id);
      toast.success(`You joined "${group.name}"!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to accept invite.";
      toast.error(msg);
    }
  };

  const handleDecline = async () => {
    try {
      await declineInvite.mutateAsync(group.id);
      toast.success(`Invitation to "${group.name}" declined.`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to decline invite.";
      toast.error(msg);
    }
  };

  const isBusy = acceptInvite.isPending || declineInvite.isPending;

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              Invited by{" "}
              <span className="font-medium">
                {creatorProfile?.displayName ?? "someone"}
              </span>{" "}
              · {group.members.length} member
              {group.members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isBusy}
              className="flex items-center gap-1"
            >
              {acceptInvite.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isBusy}
              className="flex items-center gap-1"
            >
              {declineInvite.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupCard({ group }: { group: Group }) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();
  const isCreator = currentUserId === group.creator.toString();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() =>
        navigate({
          to: "/groups/$groupId",
          params: { groupId: group.id.toString() },
        })
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{group.name}</p>
              {isCreator && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs shrink-0"
                >
                  <Crown className="h-3 w-3" />
                  Creator
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {group.members.length} member
              {group.members.length !== 1 ? "s" : ""}
              {group.pendingInvites.length > 0 && isCreator && (
                <span>
                  {" "}
                  · {group.pendingInvites.length} pending invite
                  {group.pendingInvites.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const {
    data: myGroups,
    isLoading: groupsLoading,
    error: groupsError,
  } = useMyGroups();
  const { data: invites, isLoading: invitesLoading } = useGroupInvites();

  const isLoading = groupsLoading || invitesLoading;
  const pendingInvites = invites ?? [];
  const groups = myGroups ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-sm text-muted-foreground">
            Create groups and invite people to join.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {isLoading && <LoadingState message="Loading groups…" />}

      {!isLoading && groupsError && (
        <ErrorState message="Failed to load groups. Please try again." />
      )}

      {!isLoading && !groupsError && (
        <>
          {/* Pending Invitations */}
          {pendingInvites.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pending Invitations
                </h2>
                <Badge variant="default" className="text-xs">
                  {pendingInvites.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <InviteCard key={invite.id.toString()} group={invite} />
                ))}
              </div>
              <Separator />
            </section>
          )}

          {/* My Groups */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              My Groups
            </h2>
            {groups.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">
                  No groups yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create a group and invite people to join.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  variant="outline"
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first group
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <GroupCard key={group.id.toString()} group={group} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

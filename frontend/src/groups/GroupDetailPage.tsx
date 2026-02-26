import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, UserPlus, Users, Crown, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingState from '../components/states/LoadingState';
import ErrorState from '../components/states/ErrorState';
import InviteToGroupDialog from './InviteToGroupDialog';
import { useMyGroups, useGetPublicUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { Group } from '../backend';

function MemberRow({ principalStr, isCreator }: { principalStr: string; isCreator: boolean }) {
  const { data: profile } = useGetPublicUserProfile(principalStr);
  const initials = profile?.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : principalStr.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {profile?.displayName ?? 'Loading…'}
        </p>
        {profile?.username && (
          <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
        )}
      </div>
      {isCreator && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Crown className="h-3 w-3" />
          Creator
        </Badge>
      )}
    </div>
  );
}

function GroupDetail({ group }: { group: Group }) {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);

  const currentUserId = identity?.getPrincipal().toString();
  const isCreator = currentUserId === group.creator.toString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{group.name}</h2>
            <p className="text-sm text-muted-foreground">
              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              {group.pendingInvites.length > 0 && (
                <span> · {group.pendingInvites.length} pending invite{group.pendingInvites.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCreator && (
            <Button variant="outline" onClick={() => setInviteOpen(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite People
            </Button>
          )}
          <Button
            onClick={() =>
              navigate({ to: '/groups/$groupId/chat', params: { groupId: group.id.toString() } })
            }
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Open Chat
          </Button>
        </div>
      </div>

      <Separator />

      {/* Members */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Members
        </h3>
        <div className="space-y-1">
          {group.members.map((member) => (
            <MemberRow
              key={member.toString()}
              principalStr={member.toString()}
              isCreator={member.toString() === group.creator.toString()}
            />
          ))}
        </div>
      </div>

      {/* Pending Invites (creator only) */}
      {isCreator && group.pendingInvites.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Pending Invites
            </h3>
            <div className="space-y-1">
              {group.pendingInvites.map((invitee) => (
                <MemberRow
                  key={invitee.toString()}
                  principalStr={invitee.toString()}
                  isCreator={false}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <InviteToGroupDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        group={group}
      />
    </div>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams({ from: '/groups/$groupId' });
  const navigate = useNavigate();
  const { data: groups, isLoading, error } = useMyGroups();

  const group = groups?.find((g) => g.id.toString() === groupId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: '/groups' })}
        className="mb-4 flex items-center gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Groups
      </Button>

      {isLoading && <LoadingState message="Loading group…" />}
      {error && <ErrorState message="Failed to load group." />}
      {!isLoading && !error && !group && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Group not found.</p>
        </div>
      )}
      {!isLoading && !error && group && <GroupDetail group={group} />}
    </div>
  );
}

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchUsers, useInviteToGroup } from '../hooks/useQueries';
import type { Group } from '../backend';

interface InviteToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
}

export default function InviteToGroupDialog({ open, onOpenChange, group }: InviteToGroupDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchTerm);
  const inviteToGroup = useInviteToGroup();

  const memberIds = new Set(group.members.map((m) => m.toString()));
  const pendingIds = new Set(group.pendingInvites.map((p) => p.toString()));

  const handleInvite = async (principalStr: string, displayName: string) => {
    setInvitingId(principalStr);
    try {
      await inviteToGroup.mutateAsync({ groupId: group.id, target: principalStr });
      toast.success(`Invitation sent to ${displayName}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation.';
      toast.error(msg);
    } finally {
      setInvitingId(null);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!inviteToGroup.isPending) {
      setSearchTerm('');
      onOpenChange(val);
    }
  };

  const filteredResults = (searchResults ?? []).filter(
    (r) => !memberIds.has(r.principal.toString())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <DialogTitle>Invite People</DialogTitle>
          </div>
          <DialogDescription>
            Search for users to invite to <strong>{group.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-64">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && searchTerm.trim() && filteredResults.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No users found.
              </p>
            )}

            {!isSearching && !searchTerm.trim() && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Start typing to search for users.
              </p>
            )}

            <div className="space-y-2 pr-2">
              {filteredResults.map((result) => {
                const principalStr = result.principal.toString();
                const isPending = pendingIds.has(principalStr);
                const isInviting = invitingId === principalStr;
                const initials = result.profile.displayName
                  ? result.profile.displayName.slice(0, 2).toUpperCase()
                  : result.profile.username.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={principalStr}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.profile.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">@{result.profile.username}</p>
                    </div>
                    {isPending ? (
                      <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                        Invited
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInvite(principalStr, result.profile.displayName)}
                        disabled={isInviting || inviteToGroup.isPending}
                      >
                        {isInviting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Invite'
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

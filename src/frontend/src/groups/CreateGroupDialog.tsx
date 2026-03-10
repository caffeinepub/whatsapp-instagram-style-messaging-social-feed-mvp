import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateGroup } from "../hooks/useQueries";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const createGroup = useCreateGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      toast.error("Group name is required.");
      return;
    }
    if (trimmed.length > 60) {
      toast.error("Group name must be 60 characters or fewer.");
      return;
    }

    try {
      await createGroup.mutateAsync(trimmed);
      toast.success(`Group "${trimmed}" created!`);
      setGroupName("");
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create group.";
      toast.error(msg);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!createGroup.isPending) {
      setGroupName("");
      onOpenChange(val);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <DialogTitle>Create a Group</DialogTitle>
          </div>
          <DialogDescription>
            Give your group a name. You'll be the creator and can invite people
            to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Photography Club"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={60}
              disabled={createGroup.isPending}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {groupName.length}/60
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createGroup.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroup.isPending || !groupName.trim()}
            >
              {createGroup.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

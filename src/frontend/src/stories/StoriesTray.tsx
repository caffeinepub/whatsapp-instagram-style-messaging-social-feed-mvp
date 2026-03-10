import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

interface StoryUser {
  userId: string;
  displayName: string;
  username: string;
  hasUnviewed: boolean;
}

interface StoriesTrayProps {
  storyUsers?: StoryUser[];
  onViewStory?: (userId: string) => void;
}

export default function StoriesTray({
  storyUsers = [],
  onViewStory,
}: StoriesTrayProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: currentProfile } = useGetCallerUserProfile();
  const [viewedUsers, setViewedUsers] = useState<Set<string>>(new Set());

  const isAuthenticated = !!identity;

  const handleViewStory = (userId: string) => {
    setViewedUsers((prev) => new Set([...prev, userId]));
    onViewStory?.(userId);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {/* Add Story Button */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => navigate({ to: "/stories/upload" })}
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarFallback className="text-lg">
                {(currentProfile?.displayName || "Y").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="h-3 w-3" />
            </div>
          </div>
          <span className="max-w-[56px] truncate text-xs text-muted-foreground">
            Your Story
          </span>
        </button>
      )}

      {/* Story Users */}
      {storyUsers.map((user) => {
        const isViewed = viewedUsers.has(user.userId) || !user.hasUnviewed;
        return (
          <button
            type="button"
            key={user.userId}
            onClick={() => handleViewStory(user.userId)}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div
              className={cn(
                "rounded-full p-0.5",
                isViewed
                  ? "bg-muted"
                  : "bg-gradient-to-tr from-primary to-accent",
              )}
            >
              <Avatar className="h-13 w-13 ring-2 ring-background">
                <AvatarFallback className="text-base">
                  {user.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="max-w-[56px] truncate text-xs text-muted-foreground">
              {user.displayName}
            </span>
          </button>
        );
      })}

      {/* Empty state */}
      {storyUsers.length === 0 && !isAuthenticated && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <img
            src="/assets/generated/stories-empty.dim_200x200.png"
            alt="No stories"
            className="h-10 w-10 rounded-full object-cover opacity-50"
          />
          <span>No stories yet</span>
        </div>
      )}
    </div>
  );
}

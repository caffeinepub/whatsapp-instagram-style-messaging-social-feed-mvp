import { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Call,
  CallId,
  CallStatus,
  ContentType,
  ConversationId,
  Group,
  GroupId,
  GroupMessage,
  Id,
  LiveStream,
  MediaAsset,
  Message,
  Movie,
  Post,
  PostId,
  ProfilePrivacy,
  PublicUserProfile,
  UserProfile,
  UserSearchResult,
} from "../backend";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Stale-time constants
const STALE_REALTIME = 1000 * 5; // 5 s — chat messages, online presence
const STALE_DEFAULT = 1000 * 30; // 30 s — inherited from QueryClient default

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        console.error(
          "[useGetCallerUserProfile] Error fetching profile:",
          error,
        );
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (!userId) return null;
      try {
        return await actor.getUserProfile(Principal.fromText(userId));
      } catch (error) {
        console.error(
          "[useGetUserProfile] Error fetching user profile:",
          error,
        );
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!userId,
    refetchInterval: 15000,
    retry: false,
  });
}

export function useGetPublicUserProfile(userId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PublicUserProfile | null>({
    queryKey: ["publicUserProfile", userId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getPublicUserProfile(Principal.fromText(userId));
    },
    enabled: !!actor && !actorFetching && !!userId && !!identity,
  });
}

export function useSignUp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      displayName,
      privacy,
    }: { username: string; displayName: string; privacy: ProfilePrivacy }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.signUp(username, displayName, privacy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
    onError: (error) => {
      console.error("[useSignUp] Signup error:", error);
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSetProfilePrivacy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (privacy: ProfilePrivacy) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setProfilePrivacyLevel(privacy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSetOnlineStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (status: boolean) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setOnlineStatus(status);
    },
  });
}

export function useSearchUsers(searchTerm: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserSearchResult[]>({
    queryKey: ["searchUsers", searchTerm],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (!searchTerm.trim()) return [];
      try {
        return await actor.searchUsers(searchTerm);
      } catch (error) {
        console.error("[useSearchUsers] Search error:", error);
        throw error;
      }
    },
    enabled:
      !!actor && !actorFetching && searchTerm.trim().length > 0 && !!identity,
    retry: false,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.followUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unfollowUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caption,
      media,
      contentType,
    }: { caption: string; media: MediaAsset[]; contentType: ContentType }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(caption, media, contentType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: PostId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useGetFeed() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getFeed();
    },
    enabled: !!actor && !actorFetching,
    staleTime: STALE_DEFAULT,
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: PostId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: PostId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unlikePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: { postId: PostId; text: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addComment(postId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useRemoveComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
    }: { postId: PostId; commentId: Id }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.removeComment(postId, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useListConversations() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ConversationId[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.listConversations();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetMessages(conversationId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ["messages", conversationId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getMessages(conversationId);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
    staleTime: STALE_REALTIME,
  });
}

export function useStartConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.startConversation(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: { conversationId: bigint; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendMessage(conversationId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useGetConversationDetails(conversationId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<{
    otherUserName: string;
    lastMessage?: string;
    otherUserId?: string;
  }>({
    queryKey: ["conversationDetails", conversationId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const messages = await actor.getMessages(conversationId);

      if (messages.length === 0) {
        return { otherUserName: "Unknown", lastMessage: undefined };
      }

      const currentUserId = identity?.getPrincipal().toString();
      const lastMessage = messages[messages.length - 1];

      const otherUserMessage = messages.find(
        (m) => m.sender.toString() !== currentUserId,
      );
      const otherUserId = otherUserMessage?.sender || lastMessage.sender;

      try {
        const profile = await actor.getUserProfile(otherUserId);
        return {
          otherUserName: profile?.displayName || "Unknown",
          lastMessage: lastMessage.content,
          otherUserId: otherUserId.toString(),
        };
      } catch (error) {
        console.error(
          "[useGetConversationDetails] Error fetching profile:",
          error,
        );
        return {
          otherUserName: "Unknown",
          lastMessage: lastMessage.content,
          otherUserId: otherUserId.toString(),
        };
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetSavedPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["savedPosts"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getSavedPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSavePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: PostId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.savePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useUnsavePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: PostId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unsavePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.blockUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unblockUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
  });
}

export function useGetBlockedUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["blockedUsers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getBlockedUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ====== GROUP HOOKS ======

export function useMyGroups() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Group[]>({
    queryKey: ["myGroups"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getMyGroups();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGroupInvites() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Group[]>({
    queryKey: ["groupInvites"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getGroupInvites();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createGroup(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      queryClient.invalidateQueries({ queryKey: ["groupInvites"] });
    },
  });
}

export function useInviteToGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      target,
    }: { groupId: GroupId; target: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.inviteToGroup(groupId, Principal.fromText(target));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      queryClient.invalidateQueries({ queryKey: ["groupInvites"] });
    },
  });
}

export function useAcceptGroupInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: GroupId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.acceptGroupInvite(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGroups"] });
      queryClient.invalidateQueries({ queryKey: ["groupInvites"] });
    },
  });
}

export function useDeclineGroupInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: GroupId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.declineGroupInvite(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupInvites"] });
    },
  });
}

export function useGetGroupMessages(groupId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<GroupMessage[]>({
    queryKey: ["groupMessages", groupId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getGroupMessages(groupId);
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 3000,
    staleTime: STALE_REALTIME,
  });
}

export function useSendGroupMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      content,
    }: { groupId: GroupId; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendGroupMessage(groupId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["groupMessages", variables.groupId.toString()],
      });
    },
  });
}

export function useGetOnlineUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PublicUserProfile[]>({
    queryKey: ["onlineUsers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getOnlineUsers();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 10000,
    staleTime: STALE_REALTIME,
  });
}

// ====== MOVIE HOOKS ======

export function useGetAllMovies() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Movie[]>({
    queryKey: ["movies"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAllMovies();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: STALE_DEFAULT,
  });
}

export function useGetMovie(movieId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Movie | null>({
    queryKey: ["movie", movieId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getMovie(movieId);
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useUploadMovie() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      thumbnail,
      videoFile,
    }: {
      title: string;
      description: string;
      thumbnail: ExternalBlob;
      videoFile: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.uploadMovie(title, description, thumbnail, videoFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
}

export function useLikeMovie() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: Id) => {
      if (!actor) throw new Error("Actor not available");
      await actor.likeMovie(movieId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["movie"] });
    },
  });
}

export function useUnlikeMovie() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: Id) => {
      if (!actor) throw new Error("Actor not available");
      await actor.unlikeMovie(movieId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["movie"] });
    },
  });
}

// ====== STORIES HOOKS ======

export function useUploadStory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (media: MediaAsset) => {
      if (!actor) throw new Error("Actor not available");
      await actor.uploadStory(media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useViewStory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (storyId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.viewStory(storyId);
    },
  });
}

// ====== LIVE STREAM HOOKS ======

export function useGetActiveLiveStreams() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<LiveStream[]>({
    queryKey: ["liveStreams"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getActiveLiveStreams();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 10000,
    staleTime: STALE_REALTIME,
  });
}

export function useStartLiveStream() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      streamUrl,
    }: { title: string; description: string; streamUrl: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.startLiveStream(title, description, streamUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
    },
  });
}

export function useEndLiveStream() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (streamId: Id) => {
      if (!actor) throw new Error("Actor not available");
      await actor.endLiveStream(streamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
    },
  });
}

export function useJoinLiveStream() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (streamId: Id) => {
      if (!actor) throw new Error("Actor not available");
      await actor.joinLiveStream(streamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
    },
  });
}

export function useLikeLiveStream() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (streamId: Id) => {
      if (!actor) throw new Error("Actor not available");
      await actor.likeLiveStream(streamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
    },
  });
}

// ====== CALL HOOKS ======

export function useInitiateCall() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calleeId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.initiateCall(Principal.fromText(calleeId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useAcceptCall() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: CallId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.acceptCall(callId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useDeclineCall() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: CallId) => {
      if (!actor) throw new Error("Actor not available");
      await actor.declineCall(callId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

export function useGetCallStatus(callId: CallId | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CallStatus | null>({
    queryKey: ["callStatus", callId?.toString()],
    queryFn: async () => {
      if (!actor || callId === null) throw new Error("Actor not available");
      return actor.getCall_status(callId);
    },
    enabled: !!actor && !actorFetching && !!identity && callId !== null,
    refetchInterval: 3000,
    staleTime: STALE_REALTIME,
  });
}

export function useGetIncomingCalls() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Call[]>({
    queryKey: ["incomingCalls"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getIncomingCalls();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 3000,
    staleTime: STALE_REALTIME,
  });
}

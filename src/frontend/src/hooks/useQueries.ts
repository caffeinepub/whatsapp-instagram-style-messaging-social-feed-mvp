import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Post, Message, ConversationId, UserSearchResult } from '../backend';
import { Principal } from '@dfinity/principal';
import { useInternetIdentity } from './useInternetIdentity';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
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
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserProfile(Principal.fromText(userId));
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

export function useSignUp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.signUp(username, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSearchUsers(searchTerm: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserSearchResult[]>({
    queryKey: ['searchUsers', searchTerm],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!searchTerm.trim()) return [];
      return actor.searchUsers(searchTerm);
    },
    enabled: !!actor && !actorFetching && searchTerm.trim().length > 0,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.followUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.unfollowUser(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ caption, images }: { caption: string; images: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(caption, images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useGetFeed() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['feed'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFeed();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListConversations() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ConversationId[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listConversations();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetMessages(conversationId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMessages(conversationId);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
  });
}

export function useStartConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startConversation(Principal.fromText(userId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.sendMessage(conversationId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useGetConversationDetails(conversationId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<{ otherUserName: string; lastMessage?: string }>({
    queryKey: ['conversationDetails', conversationId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const messages = await actor.getMessages(conversationId);
      
      if (messages.length === 0) {
        return { otherUserName: 'Unknown', lastMessage: undefined };
      }

      const currentUserId = identity?.getPrincipal().toString();
      const lastMessage = messages[messages.length - 1];
      
      // Find a message from the other user
      const otherUserMessage = messages.find(m => m.sender.toString() !== currentUserId);
      const otherUserId = otherUserMessage?.sender || lastMessage.sender;
      
      // Try to get the other user's profile
      // Note: This will fail due to backend authorization restrictions
      try {
        const profile = await actor.getUserProfile(otherUserId);
        return {
          otherUserName: profile?.displayName || 'Unknown',
          lastMessage: lastMessage.content,
        };
      } catch {
        return { otherUserName: 'User', lastMessage: lastMessage.content };
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ConversationId = bigint;
export type UserId = Principal;
export interface Post {
    id: bigint;
    author: UserId;
    timestamp: bigint;
    caption: string;
    images: Array<ImageAssetUrl>;
}
export type PostId = bigint;
export interface Message {
    id: Id;
    content: string;
    read: boolean;
    sender: UserId;
    conversationId: ConversationId;
    timestamp: bigint;
}
export type Id = bigint;
export type Username = string;
export interface UserSearchResult {
    principal: Principal;
    profile: UserProfile;
}
export interface UserProfile {
    bio: string;
    username: Username;
    displayName: string;
    followers: Array<UserId>;
    following: Array<UserId>;
    avatar?: Uint8Array;
}
export type ImageAssetUrl = string;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Handles Internet Identity authentication and session management (requires user role)
     */
    authenticate(): Promise<void>;
    /**
     * / Creates a new post with up to 10 images (requires user role)
     */
    createPost(caption: string, images: Array<ImageAssetUrl>): Promise<PostId>;
    /**
     * / Follows another user (requires user role)
     */
    followUser(userToFollow: UserId): Promise<void>;
    /**
     * / Get caller's user profile (required by frontend)
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Retrieves a user's feed with posts from users they follow (requires user role)
     */
    getFeed(): Promise<Array<Post>>;
    /**
     * / Gets all messages for a conversation (requires user role and participation)
     */
    getMessages(conversationId: ConversationId): Promise<Array<Message>>;
    /**
     * / Get any user's profile (own profile or admin can view any)
     */
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Lists all conversations for the caller (requires user role)
     */
    listConversations(): Promise<Array<ConversationId>>;
    /**
     * / Save caller's user profile (required by frontend)
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Search for users by username (requires user role)
     */
    searchUsers(searchTerm: string): Promise<Array<UserSearchResult>>;
    /**
     * / Sends a message in a conversation (requires user role and participation)
     */
    sendMessage(conversationId: ConversationId, content: string): Promise<void>;
    /**
     * / User signup and onboarding flow (accessible to guests to create accounts)
     */
    signUp(username: Username, displayName: string): Promise<void>;
    /**
     * / Starts a new conversation with another user (requires user role)
     */
    startConversation(participant: UserId): Promise<ConversationId>;
    /**
     * / Unfollows another user (requires user role)
     */
    unfollowUser(userToUnfollow: UserId): Promise<void>;
}

import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type CommentId = bigint;
export interface GroupMessage {
    content: string;
    sender: Principal;
    groupId: GroupId;
    timestamp: bigint;
}
export interface Comment {
    commentId: CommentId;
    authorId: UserId;
    text: string;
    timestamp: bigint;
}
export interface MediaAsset {
    url: string;
    isDataUrl: boolean;
}
export type PostId = bigint;
export interface Group {
    id: GroupId;
    creator: Principal;
    members: Array<Principal>;
    name: string;
    pendingInvites: Array<Principal>;
}
export interface UserSearchResult {
    principal: Principal;
    profile: PublicUserProfile;
}
export type GroupId = bigint;
export type ConversationId = bigint;
export type UserId = Principal;
export interface PublicUserProfile {
    bio: string;
    username: Username;
    displayName: string;
    privacy: ProfilePrivacy;
    avatar?: Uint8Array;
}
export interface Post {
    id: bigint;
    media: Array<MediaAsset>;
    contentType: ContentType;
    author: UserId;
    likes: Array<UserId>;
    timestamp: bigint;
    caption: string;
    comments: Array<Comment>;
}
export type Id = bigint;
export interface Message {
    id: Id;
    content: string;
    read: boolean;
    sender: UserId;
    conversationId: ConversationId;
    timestamp: bigint;
}
export type Username = string;
export interface UserProfile {
    bio: string;
    blockedUsers: Array<UserId>;
    username: Username;
    displayName: string;
    savedPosts: Array<PostId>;
    privacy: ProfilePrivacy;
    followers: Array<UserId>;
    following: Array<UserId>;
    avatar?: Uint8Array;
    online: boolean;
}
export enum ContentType {
    post = "post",
    reel = "reel"
}
export enum ProfilePrivacy {
    profilePrivate = "profilePrivate",
    profilePublic = "profilePublic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptGroupInvite(groupId: GroupId): Promise<void>;
    addComment(postId: PostId, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticate(): Promise<void>;
    blockUser(target: Principal): Promise<void>;
    clearCommentsFromPost(postId: PostId): Promise<void>;
    createGroup(name: string): Promise<GroupId>;
    createPost(caption: string, media: Array<MediaAsset>, contentType: ContentType): Promise<PostId>;
    declineGroupInvite(groupId: GroupId): Promise<void>;
    deletePost(postId: PostId): Promise<void>;
    followUser(userToFollow: UserId): Promise<void>;
    getBlockedUsers(): Promise<Array<Principal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeed(): Promise<Array<Post>>;
    getGroupInvites(): Promise<Array<Group>>;
    getGroupMessages(groupId: GroupId): Promise<Array<GroupMessage>>;
    getMessages(conversationId: ConversationId): Promise<Array<Message>>;
    getMyGroups(): Promise<Array<Group>>;
    getOnlineUsers(): Promise<Array<PublicUserProfile>>;
    getPublicUserProfile(userId: UserId): Promise<PublicUserProfile | null>;
    getSavedPosts(): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeTimers(): Promise<void>;
    inviteToGroup(groupId: GroupId, target: Principal): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: PostId): Promise<void>;
    listConversations(): Promise<Array<ConversationId>>;
    removeComment(postId: PostId, commentId: CommentId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePost(postId: PostId): Promise<void>;
    searchUsers(searchTerm: string): Promise<Array<UserSearchResult>>;
    sendGroupMessage(groupId: GroupId, content: string): Promise<void>;
    sendMessage(conversationId: ConversationId, content: string): Promise<void>;
    setOnlineStatus(status: boolean): Promise<void>;
    setProfilePrivacyLevel(privacy: ProfilePrivacy): Promise<void>;
    signUp(username: Username, displayName: string, privacy: ProfilePrivacy): Promise<void>;
    startConversation(participant: UserId): Promise<ConversationId>;
    unblockUser(target: Principal): Promise<void>;
    unfollowUser(userToUnfollow: UserId): Promise<void>;
    unlikePost(postId: PostId): Promise<void>;
    unsavePost(postId: PostId): Promise<void>;
}

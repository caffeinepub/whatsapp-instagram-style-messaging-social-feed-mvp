import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface LiveStream {
    id: Id;
    title: string;
    active: boolean;
    description: string;
    author: UserId;
    likes: Array<UserId>;
    viewers: Array<UserId>;
    timestamp: bigint;
    streamUrl: string;
}
export interface Movie {
    id: Id;
    title: string;
    thumbnail: ExternalBlob;
    description: string;
    videoFile: ExternalBlob;
    likes: Array<UserId>;
    timestamp: bigint;
    uploader: UserId;
    comments: Array<Comment>;
}
export interface GroupMessage {
    content: string;
    sender: Principal;
    groupId: GroupId;
    timestamp: bigint;
}
export interface Comment {
    commentId: Id;
    authorId: UserId;
    text: string;
    timestamp: bigint;
}
export type PostId = bigint;
export interface MediaAsset {
    url: string;
    isDataUrl: boolean;
}
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
    id: Id;
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
export type CallId = bigint;
export interface Call {
    id: CallId;
    caller: UserId;
    callee: UserId;
    status: CallStatus;
    timestamp: bigint;
}
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
export enum CallStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
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
    acceptCall(callId: CallId): Promise<void>;
    acceptGroupInvite(groupId: GroupId): Promise<void>;
    addComment(postId: PostId, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticate(): Promise<void>;
    blockUser(target: Principal): Promise<void>;
    clearCommentsFromPost(postId: PostId): Promise<void>;
    createGroup(name: string): Promise<GroupId>;
    createPost(caption: string, media: Array<MediaAsset>, contentType: ContentType): Promise<PostId>;
    declineCall(callId: CallId): Promise<void>;
    declineGroupInvite(groupId: GroupId): Promise<void>;
    deletePost(postId: PostId): Promise<void>;
    endLiveStream(streamId: Id): Promise<void>;
    followUser(userToFollow: UserId): Promise<void>;
    getActiveLiveStreams(): Promise<Array<LiveStream>>;
    getAllMovies(): Promise<Array<Movie>>;
    getBlockedUsers(): Promise<Array<Principal>>;
    getCall_status(callId: CallId): Promise<CallStatus | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFeed(): Promise<Array<Post>>;
    getGroupInvites(): Promise<Array<Group>>;
    getGroupMessages(groupId: GroupId): Promise<Array<GroupMessage>>;
    getIncomingCalls(): Promise<Array<Call>>;
    getMessages(conversationId: ConversationId): Promise<Array<Message>>;
    getMovie(movieId: Id): Promise<Movie | null>;
    getMyGroups(): Promise<Array<Group>>;
    getOnlineUsers(): Promise<Array<PublicUserProfile>>;
    getPublicUserProfile(userId: UserId): Promise<PublicUserProfile | null>;
    getSavedPosts(): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeTimers(): Promise<void>;
    initiateCall(callee: UserId): Promise<CallId>;
    inviteToGroup(groupId: GroupId, target: Principal): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    joinLiveStream(streamId: Id): Promise<void>;
    likeLiveStream(streamId: Id): Promise<void>;
    likeMovie(movieId: Id): Promise<void>;
    likePost(postId: PostId): Promise<void>;
    listConversations(): Promise<Array<ConversationId>>;
    removeComment(postId: PostId, commentId: Id): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePost(postId: PostId): Promise<void>;
    searchUsers(searchTerm: string): Promise<Array<UserSearchResult>>;
    sendGroupMessage(groupId: GroupId, content: string): Promise<void>;
    sendMessage(conversationId: ConversationId, content: string): Promise<void>;
    setOnlineStatus(status: boolean): Promise<void>;
    setProfilePrivacyLevel(privacy: ProfilePrivacy): Promise<void>;
    signUp(username: Username, displayName: string, privacy: ProfilePrivacy): Promise<void>;
    startConversation(participant: UserId): Promise<ConversationId>;
    startLiveStream(title: string, description: string, streamUrl: string): Promise<Id>;
    unblockUser(target: Principal): Promise<void>;
    unfollowUser(userToUnfollow: UserId): Promise<void>;
    unlikeMovie(movieId: Id): Promise<void>;
    unlikePost(postId: PostId): Promise<void>;
    unsavePost(postId: PostId): Promise<void>;
    uploadMovie(title: string, description: string, thumbnail: ExternalBlob, videoFile: ExternalBlob): Promise<Id>;
    uploadStory(media: MediaAsset): Promise<void>;
    viewStory(storyId: Id): Promise<MediaAsset | null>;
}

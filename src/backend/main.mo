import Blob "mo:core/Blob";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Timer "mo:core/Timer";
import Array "mo:core/Array";
import List "mo:core/List";
import Order "mo:core/Order";

import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  include MixinStorage();

  type UserId = Principal;
  type Username = Text;
  type PostId = Nat;
  type MediaAsset = {
    url : Text;
    isDataUrl : Bool;
  };

  type ContentType = { #post; #reel };
  module Comment {
    public type Id = Nat;
    public type Comment = {
      commentId : Id;
      authorId : UserId;
      text : Text;
      timestamp : Int;
    };
  };

  module Post {
    public type Id = Nat;
    public type Post = {
      id : Id;
      author : UserId;
      caption : Text;
      media : [MediaAsset];
      contentType : ContentType;
      likes : [UserId];
      comments : [Comment.Comment];
      timestamp : Int;
    };
  };

  type ConversationId = Nat;

  module Message {
    public type Id = Nat;
    public type Message = {
      id : Id;
      sender : UserId;
      content : Text;
      timestamp : Int;
      read : Bool;
      conversationId : ConversationId;
    };
  };

  module Conversation {
    public type Conversation = {
      id : ConversationId;
      participants : [UserId];
      messages : [Message.Message];
    };
  };

  public type ProfilePrivacy = {
    #profilePublic;
    #profilePrivate;
  };

  public type UserProfile = {
    username : Username;
    displayName : Text;
    bio : Text;
    avatar : ?Blob;
    followers : [UserId];
    following : [UserId];
    online : Bool;
    privacy : ProfilePrivacy;
    savedPosts : [PostId];
    blockedUsers : [UserId];
  };

  module UserProfile {
    public func compare(user1 : UserProfile, user2 : UserProfile) : Order.Order {
      Text.compare(user1.username, user2.username);
    };
  };

  public type PublicUserProfile = {
    username : Username;
    displayName : Text;
    bio : Text;
    avatar : ?Blob;
    privacy : ProfilePrivacy;
  };

  public type UserSearchResult = {
    principal : Principal;
    profile : PublicUserProfile;
  };

  module Stories {
    public type Id = Nat;
    public type Story = {
      id : Id;
      author : UserId;
      media : MediaAsset;
      viewers : [UserId]; // Maintain a list of viewers
      timestamp : Int;
    };
  };

  public type GroupId = Nat;

  public type Group = {
    id : GroupId;
    name : Text;
    creator : Principal;
    members : [Principal];
    pendingInvites : [Principal];
  };

  // Group Message Type
  public type GroupMessage = {
    groupId : GroupId;
    sender : Principal;
    content : Text;
    timestamp : Int;
  };

  module Movie {
    public type Id = Nat;
    public type Movie = {
      id : Id;
      title : Text;
      description : Text;
      thumbnail : Storage.ExternalBlob;
      videoFile : Storage.ExternalBlob;
      uploader : UserId;
      likes : [UserId];
      comments : [Comment.Comment];
      timestamp : Int;
    };
  };

  module LiveStream {
    public type Id = Nat;
    public type LiveStream = {
      id : Id;
      author : UserId;
      title : Text;
      description : Text;
      streamUrl : Text;
      viewers : [UserId];
      active : Bool;
      likes : [UserId];
      timestamp : Int;
    };
  };

  public type CallId = Nat;
  public type CallStatus = { #pending; #accepted; #declined };
  public type Call = {
    id : CallId;
    caller : UserId;
    callee : UserId;
    status : CallStatus;
    timestamp : Int;
  };

  let users = Map.empty<UserId, UserProfile>();
  let posts = Map.empty<PostId, Post.Post>();
  var nextPostId = 0;
  let conversations = Map.empty<UserId, List.List<ConversationId>>();
  let messages = Map.empty<ConversationId, List.List<Message.Message>>();
  var nextConversationId = 0;
  var nextMessageId = 0;

  let groups = Map.empty<GroupId, Group>();
  var nextGroupId = 0;

  let groupMessages = Map.empty<GroupId, List.List<GroupMessage>>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let storiesStore = Map.empty<Stories.Id, Stories.Story>();
  var nextStoryId = 0;

  let moviesStore = Map.empty<Movie.Id, Movie.Movie>();
  var nextMovieId = 0;

  let livestreamsStore = Map.empty<LiveStream.Id, LiveStream.LiveStream>();
  var nextLivestreamId = 0;

  func isFollowing(caller : UserId, target : UserId) : Bool {
    let callerProfile = users.get(caller);
    switch (callerProfile) {
      case (null) { false };
      case (?profile) {
        let found = profile.following.find(func(id : UserId) : Bool { id == target });
        found != null;
      };
    };
  };

  func isBlocked(user1 : UserId, user2 : UserId) : Bool {
    let profile1 = users.get(user1);
    let profile2 = users.get(user2);

    let user1BlockedUser2 = switch (profile1) {
      case (null) { false };
      case (?p) { p.blockedUsers.find(func(id : UserId) : Bool { id == user2 }) != null };
    };

    let user2BlockedUser1 = switch (profile2) {
      case (null) { false };
      case (?p) { p.blockedUsers.find(func(id : UserId) : Bool { id == user1 }) != null };
    };

    user1BlockedUser2 or user2BlockedUser1;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Allow anonymous callers (guests) to access public profiles
    let profile = users.get(user);

    switch (profile) {
      case (null) { null };
      case (?profile) {
        // Check if caller is authenticated
        let isAuthenticated = AccessControl.hasPermission(accessControlState, caller, #user);

        if (not isAuthenticated) {
          // Anonymous caller: only return public profiles
          if (profile.privacy == #profilePublic) {
            return ?profile;
          } else {
            return null;
          };
        };

        // Authenticated caller
        // Check if blocked
        if (isBlocked(caller, user)) {
          return null;
        };

        // Allow viewing own profile
        if (caller == user) {
          return ?profile;
        };

        // Allow admins to view any profile
        if (AccessControl.isAdmin(accessControlState, caller)) {
          return ?profile;
        };

        // For other users: check privacy settings
        if (profile.privacy == #profilePublic) {
          return ?profile;
        };

        // Private profile: only visible if following
        if (isFollowing(caller, user)) {
          return ?profile;
        };

        // Private profile and not following
        null;
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = users.get(caller);
    switch (existingProfile) {
      case (?existing) {
        if (existing.username != profile.username) {
          let usernameExists = users.values().toArray().find(
            func(p : UserProfile) : Bool {
              p.username == profile.username
            }
          );
          if (usernameExists != null) {
            Runtime.trap("Username already taken");
          };
        };
      };
      case (null) {};
    };

    users.add(caller, profile);
  };

  public shared ({ caller }) func signUp(username : Username, displayName : Text, privacy : ProfilePrivacy) : async () {
    let existing = users.values().toArray().find(
      func(profile : UserProfile) : Bool { profile.username == username }
    );

    switch (existing) {
      case (null) {};
      case (?profile) {
        Runtime.trap("Username '" # username # "' has already been taken");
      };
    };

    let userProfile : UserProfile = {
      displayName;
      username;
      bio = "";
      avatar = null;
      followers = [];
      following = [];
      online = false;
      privacy;
      savedPosts = [];
      blockedUsers = [];
    };

    users.add(caller, userProfile);
  };

  public shared ({ caller }) func followUser(userToFollow : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    if (caller == userToFollow) {
      Runtime.trap("Cannot follow yourself");
    };

    if (isBlocked(caller, userToFollow)) {
      Runtime.trap("Cannot follow blocked user");
    };

    let callerProfile = users.get(caller);
    let targetProfile = users.get(userToFollow);

    if (targetProfile == null) { Runtime.trap("User does not exist") };
    if (callerProfile == null) { Runtime.trap("Caller must be signed up before following") };

    switch (callerProfile) {
      case (?profile) {
        let alreadyFollowing = profile.following.find(func(id : UserId) : Bool { id == userToFollow });
        if (alreadyFollowing != null) {
          Runtime.trap("Already following this user");
        };
      };
      case (null) {};
    };

    let updatedFollowing = switch (callerProfile) {
      case (null) { [] };
      case (?profile) { profile.following.concat([userToFollow]) };
    };

    let updatedFollowers = switch (targetProfile) {
      case (null) { [] };
      case (?profile) { profile.followers.concat([caller]) };
    };

    let newCallerProfile = switch (callerProfile) {
      case (null) { Runtime.trap("Caller profile should exist") };
      case (?profile) { { profile with following = updatedFollowing } };
    };

    let newTargetProfile = switch (targetProfile) {
      case (null) { Runtime.trap("Target profile should exist") };
      case (?profile) { { profile with followers = updatedFollowers } };
    };

    users.add(caller, newCallerProfile);
    users.add(userToFollow, newTargetProfile);
  };

  public shared ({ caller }) func unfollowUser(userToUnfollow : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };

    let callerProfile = users.get(caller);
    let targetProfile = users.get(userToUnfollow);

    if (targetProfile == null) { Runtime.trap("User does not exist") };
    if (callerProfile == null) { Runtime.trap("Caller must be signed up") };

    let updatedFollowing = switch (callerProfile) {
      case (null) { [] };
      case (?profile) {
        profile.following.filter(func(id : UserId) : Bool { id != userToUnfollow })
      };
    };

    let updatedFollowers = switch (targetProfile) {
      case (null) { [] };
      case (?profile) {
        profile.followers.filter(func(id : UserId) : Bool { id != caller })
      };
    };

    let newCallerProfile = switch (callerProfile) {
      case (null) { Runtime.trap("Caller profile should exist") };
      case (?profile) { { profile with following = updatedFollowing } };
    };

    let newTargetProfile = switch (targetProfile) {
      case (null) { Runtime.trap("Target profile should exist") };
      case (?profile) { { profile with followers = updatedFollowers } };
    };

    users.add(caller, newCallerProfile);
    users.add(userToUnfollow, newTargetProfile);
  };

  // POST LOGIC
  public shared ({ caller }) func createPost(
    caption : Text,
    media : [MediaAsset],
    contentType : ContentType,
  ) : async PostId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    if (media.size() > 10) { Runtime.trap("Cannot upload more than 10 media items per post") };

    let post : Post.Post = {
      id = nextPostId;
      author = caller;
      caption;
      media;
      timestamp = 0;
      likes = [];
      contentType;
      comments = [];
    };

    posts.add(nextPostId, post);
    nextPostId += 1;
    post.id;
  };

  public shared ({ caller }) func deletePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };

    switch (posts.get(postId)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        // Ownership check: only the author (or an admin) can delete their post
        if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the post owner can delete their post");
        };

        // Delete the post
        posts.remove(postId);
      };
    };
  };

  public shared ({ caller }) func likePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };

    let post = posts.get(postId);
    switch (post) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (isBlocked(caller, post.author)) {
          Runtime.trap("Cannot like post from blocked user");
        };

        let alreadyLiked = post.likes.find(func(id : UserId) : Bool { id == caller });
        if (alreadyLiked != null) {
          Runtime.trap("Already liked this post");
        };
        let updatedLikes = post.likes.concat([caller]);
        let updatedPost = { post with likes = updatedLikes };
        posts.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlike posts");
    };

    let post = posts.get(postId);
    switch (post) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let updatedLikes = post.likes.filter(func(id : UserId) : Bool { id != caller });
        let updatedPost = { post with likes = updatedLikes };
        posts.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func addComment(postId : PostId, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment on posts");
    };

    let post = posts.get(postId);
    switch (post) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (isBlocked(caller, post.author)) {
          Runtime.trap("Cannot comment on post from blocked user");
        };

        let newCommentId = if (post.comments.size() == 0) { 1 } else {
          let reversed = post.comments.reverse();
          reversed[0].commentId + 1;
        };
        let newComment : Comment.Comment = {
          commentId = newCommentId;
          authorId = caller;
          text;
          timestamp = 0;
        };
        let updatedComments = post.comments.concat([newComment]);
        let updatedPost = { post with comments = updatedComments };
        posts.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func clearCommentsFromPost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear all comments from a post");
    };

    let post = posts.get(postId);
    switch (post) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let updatedPost = { post with comments = [] };
        posts.add(postId, updatedPost);
      };
    };
  };

  public shared ({ caller }) func removeComment(postId : PostId, commentId : Comment.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

    let post = posts.get(postId);
    switch (post) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let commentToRemove = post.comments.find(
          func(comment) { comment.commentId == commentId }
        );
        switch (commentToRemove) {
          case (null) { Runtime.trap("Comment not found") };
          case (?comment) {
            let isCommentAuthor = comment.authorId == caller;
            let isPostAuthor = post.author == caller;
            let isAdmin = AccessControl.isAdmin(accessControlState, caller);
            if (not (isCommentAuthor or isPostAuthor or isAdmin)) {
              Runtime.trap("Unauthorized: Can only delete your own comments, or comments on your posts, or be an admin");
            };

            let filteredComments = post.comments.filter(
              func(comment) { comment.commentId != commentId }
            );
            let updatedPost = { post with comments = filteredComments };
            posts.add(postId, updatedPost);
          };
        };
      };
    };
  };

  public query ({ caller }) func getFeed() : async [Post.Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view feed");
    };

    let callerProfile = users.get(caller);

    let userPosts = posts.values().toArray().filter(
      func(post) : Bool {
        if (isBlocked(caller, post.author)) {
          return false;
        };

        switch (callerProfile) {
          case (null) { false };
          case (?profile) {
            if (post.author == caller) { return true };
            let isFollowing = profile.following.find(func(id : UserId) : Bool { id == post.author });
            isFollowing != null;
          };
        };
      }
    );

    userPosts;
  };

  // STORIES LOGIC (Ephemeral content)
  public shared ({ caller }) func uploadStory(media : MediaAsset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload stories");
    };

    // Validate media content
    if (media.url == "") {
      Runtime.trap("Media content is missing");
    };

    let story : Stories.Story = {
      id = nextStoryId;
      author = caller;
      media;
      viewers = [];
      timestamp = 0;
    };
    storiesStore.add(nextStoryId, story);
    nextStoryId += 1;
  };

  public shared ({ caller }) func viewStory(storyId : Stories.Id) : async ?MediaAsset {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view stories");
    };

    switch (storiesStore.get(storyId)) {
      case (null) { Runtime.trap("Story not found") };
      case (?story) {
        let hasViewed = story.viewers.find(func(viewer) { viewer == caller }) != null;
        if (hasViewed) {
          Runtime.trap("Story has already been viewed");
        };

        let updatedViewers = story.viewers.concat([caller]);
        // Update story with new viewer
        let updatedStory = { story with viewers = updatedViewers };

        storiesStore.add(storyId, updatedStory);

        // Check if all followers have viewed, then remove story
        switch (users.get(story.author)) {
          case (null) { Runtime.trap("Story author not found") };
          case (?authorProfile) {
            let hasUnviewedFollowers = authorProfile.followers.find(func(follower) { updatedViewers.find(func(viewer) { viewer == follower }) == null }) != null;
            if (not hasUnviewedFollowers) {
              storiesStore.remove(storyId);
            };
          };
        };

        ?story.media;
      };
    };
  };

  // Call feature
  let callStore = Map.empty<CallId, Call>();
  var nextCallId = 0;

  public shared ({ caller }) func initiateCall(callee : UserId) : async CallId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate calls");
    };

    let call : Call = {
      id = nextCallId;
      caller;
      callee;
      status = #pending;
      timestamp = 0;
    };

    callStore.add(nextCallId, call);
    nextCallId += 1;

    call.id;
  };

  public shared ({ caller }) func acceptCall(callId : CallId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept calls");
    };

    let call = callStore.get(callId);
    switch (call) {
      case (null) { Runtime.trap("Call not found") };
      case (?call) {
        if (call.callee != caller) {
          Runtime.trap("Only the callee can accept the call");
        };
        callStore.add(callId, { call with status = #accepted });
      };
    };
  };

  public shared ({ caller }) func declineCall(callId : CallId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can decline calls");
    };

    let call = callStore.get(callId);
    switch (call) {
      case (null) { Runtime.trap("Call not found") };
      case (?call) {
        if (call.callee != caller) {
          Runtime.trap("Only the callee can decline the call");
        };
        callStore.add(callId, { call with status = #declined });
      };
    };
  };

  // Only the caller or callee of a call may query its status
  public query ({ caller }) func getCall_status(callId : CallId) : async ?CallStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query call status");
    };

    switch (callStore.get(callId)) {
      case (null) { null };
      case (?call) {
        if (call.caller != caller and call.callee != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only call participants can view call status");
        };
        ?call.status;
      };
    };
  };


  public query ({ caller }) func getIncomingCalls() : async [Call] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    callStore.values().filter(func(c : Call) : Bool {
      c.callee == caller and c.status == #pending
    }).toArray();
  };

  // MOVIE LOGIC

  public shared ({ caller }) func uploadMovie(
    title : Text,
    description : Text,
    thumbnail : Storage.ExternalBlob,
    videoFile : Storage.ExternalBlob,
  ) : async Movie.Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload movies");
    };

    let movie : Movie.Movie = {
      id = nextMovieId;
      title;
      description;
      thumbnail;
      videoFile;
      uploader = caller;
      likes = [];
      comments = [];
      timestamp = 0;
    };

    moviesStore.add(nextMovieId, movie);
    nextMovieId += 1;

    movie.id;
  };

  public shared ({ caller }) func likeMovie(movieId : Movie.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like movies");
    };

    let movie = moviesStore.get(movieId);
    switch (movie) {
      case (null) { Runtime.trap("Movie not found") };
      case (?movie) {
        let alreadyLiked = movie.likes.find(func(id : UserId) : Bool { id == caller });
        if (alreadyLiked != null) {
          Runtime.trap("Already liked this movie");
        };
        let updatedLikes = movie.likes.concat([caller]);
        let updatedMovie = { movie with likes = updatedLikes };
        moviesStore.add(movieId, updatedMovie);
      };
    };
  };

  public shared ({ caller }) func unlikeMovie(movieId : Movie.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlike movies");
    };

    let movie = moviesStore.get(movieId);
    switch (movie) {
      case (null) { Runtime.trap("Movie not found") };
      case (?movie) {
        let updatedLikes = movie.likes.filter(func(id : UserId) : Bool { id != caller });
        let updatedMovie = { movie with likes = updatedLikes };
        moviesStore.add(movieId, updatedMovie);
      };
    };
  };

  public query ({ caller }) func getAllMovies() : async [Movie.Movie] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    moviesStore.values().toArray();
  };

  public query ({ caller }) func getMovie(movieId : Movie.Id) : async ?Movie.Movie {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };

    moviesStore.get(movieId);
  };

  // LIVE STREAM LOGIC

  public shared ({ caller }) func startLiveStream(title : Text, description : Text, streamUrl : Text) : async LiveStream.Id {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can start live streams");
    };

    let liveStream : LiveStream.LiveStream = {
      id = nextLivestreamId;
      author = caller;
      title;
      description;
      streamUrl;
      viewers = [];
      active = true;
      likes = [];
      timestamp = 0;
    };

    livestreamsStore.add(nextLivestreamId, liveStream);
    nextLivestreamId += 1;

    liveStream.id;
  };

  public shared ({ caller }) func endLiveStream(streamId : LiveStream.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only the author can end their live stream");
    };

    let liveStream = livestreamsStore.get(streamId);
    switch (liveStream) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?liveStream) {
        if (liveStream.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Only the author of the live stream can end it");
        };

        // Update the live stream to inactive
        livestreamsStore.add(streamId, { liveStream with active = false });
      };
    };
  };

  public shared ({ caller }) func joinLiveStream(streamId : LiveStream.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can join live streams");
    };

    let liveStream = livestreamsStore.get(streamId);
    switch (liveStream) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?liveStream) {
        if (not liveStream.active) {
          Runtime.trap("Live stream is not currently active");
        };

        let updatedViewers = liveStream.viewers.concat([caller]);
        livestreamsStore.add(streamId, { liveStream with viewers = updatedViewers });
      };
    };
  };

  public shared ({ caller }) func likeLiveStream(streamId : LiveStream.Id) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like live streams");
    };

    let liveStream = livestreamsStore.get(streamId);
    switch (liveStream) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?liveStream) {
        let alreadyLiked = liveStream.likes.find(func(id : UserId) : Bool { id == caller });
        if (alreadyLiked != null) {
          Runtime.trap("Already liked this live stream");
        };
        let updatedLikes = liveStream.likes.concat([caller]);
        livestreamsStore.add(streamId, { liveStream with likes = updatedLikes });
      };
    };
  };

  public query ({ caller }) func getActiveLiveStreams() : async [LiveStream.LiveStream] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return [];
    };

    livestreamsStore.values().toArray().filter(func(liveStream) { liveStream.active });
  };

  // CHAT LOGIC
  public shared ({ caller }) func startConversation(participant : UserId) : async ConversationId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start conversations");
    };

    if (caller == participant) {
      Runtime.trap("Cannot start conversation with yourself");
    };

    if (isBlocked(caller, participant)) {
      Runtime.trap("Cannot start conversation with blocked user");
    };

    if (users.get(participant) == null) {
      Runtime.trap("Participant user does not exist");
    };

    let callerConvs = conversations.get(caller);
    switch (callerConvs) {
      case (?convList) {
        let existingConv = convList.values().toArray().find(
          func(convId : ConversationId) : Bool {
            let msgs = messages.get(convId);
            switch (msgs) {
              case (?msgList) {
                let hasParticipant = msgList.values().toArray().find(
                  func(msg : Message.Message) : Bool {
                    msg.sender == participant or msg.sender == caller
                  }
                );
                hasParticipant != null;
              };
              case (null) { false };
            };
          }
        );
        if (existingConv != null) {
          Runtime.trap("Conversation already exists with this user");
        };
      };
      case (null) {};
    };

    let newConversationId = nextConversationId;
    nextConversationId += 1;

    let callerConvList = switch (conversations.get(caller)) {
      case (null) { List.empty<ConversationId>() };
      case (?list) { list };
    };
    callerConvList.add(newConversationId);
    conversations.add(caller, callerConvList);

    let participantConvList = switch (conversations.get(participant)) {
      case (null) { List.empty<ConversationId>() };
      case (?list) { list };
    };
    participantConvList.add(newConversationId);
    conversations.add(participant, participantConvList);

    messages.add(newConversationId, List.empty<Message.Message>());

    newConversationId;
  };

  public shared ({ caller }) func sendMessage(conversationId : ConversationId, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let callerConvs = conversations.get(caller);
    let isParticipant = switch (callerConvs) {
      case (null) { false };
      case (?convList) {
        let found = convList.values().toArray().find(
          func(id : ConversationId) : Bool { id == conversationId }
        );
        found != null;
      };
    };

    if (not isParticipant) {
      Runtime.trap("Unauthorized: Not a participant in this conversation");
    };

    // Check if any participant in the conversation is blocked
    let allMessages = switch (messages.get(conversationId)) {
      case (null) { List.empty<Message.Message>() };
      case (?msgs) { msgs };
    };

    let messagesArray = allMessages.values().toArray();
    if (messagesArray.size() > 0) {
      let otherParticipant = if (messagesArray[0].sender == caller) {
        // Find the other participant
        let found = messagesArray.find(func(msg : Message.Message) : Bool { msg.sender != caller });
        switch (found) {
          case (null) { caller }; // Shouldn't happen
          case (?msg) { msg.sender };
        };
      } else {
        messagesArray[0].sender;
      };

      if (isBlocked(caller, otherParticipant)) {
        Runtime.trap("Cannot send message to blocked user");
      };
    };

    let newMessage : Message.Message = {
      id = nextMessageId;
      sender = caller;
      content;
      timestamp = 0;
      read = false;
      conversationId;
    };

    allMessages.add(newMessage);
    messages.add(conversationId, allMessages);
    nextMessageId += 1;
  };

  public query ({ caller }) func getMessages(conversationId : ConversationId) : async [Message.Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    let callerConvs = conversations.get(caller);
    let isParticipant = switch (callerConvs) {
      case (null) { false };
      case (?convList) {
        let found = convList.values().toArray().find(
          func(id : ConversationId) : Bool { id == conversationId }
        );
        found != null;
      };
    };

    if (not isParticipant) {
      Runtime.trap("Unauthorized: Not a participant in this conversation");
    };

    let msgs = switch (messages.get(conversationId)) {
      case (null) { List.empty<Message.Message>() };
      case (?msgs) { msgs };
    };

    msgs.values().toArray();
  };

  public query ({ caller }) func listConversations() : async [ConversationId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list conversations");
    };

    let convs = conversations.get(caller);
    switch (convs) {
      case (null) { [] };
      case (?convList) { convList.values().toArray() };
    };
  };

  public shared ({ caller }) func authenticate() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    if (not users.containsKey(caller)) {
      Runtime.trap("User does not exist. Please sign up first.");
    };

    updateOnlineStatus(caller, true);
  };

  public shared ({ caller }) func setOnlineStatus(status : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their status");
    };

    updateOnlineStatus(caller, status);
  };

  func updateOnlineStatus(userId : UserId, status : Bool) {
    let profile = users.get(userId);
    switch (profile) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        users.add(userId, { profile with online = status });
      };
    };
  };

  public query ({ caller }) func searchUsers(searchTerm : Text) : async [UserSearchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for other users");
    };

    users.toArray().filter(
      func((principal, user)) {
        not isBlocked(caller, principal) and
        (user.username.contains(#text searchTerm) or user.displayName.contains(#text searchTerm)) and
        user.privacy == #profilePublic
      }
    ).map<(UserId, UserProfile), UserSearchResult>(
      func((principal, profile)) {
        {
          principal;
          profile = {
            username = profile.username;
            displayName = profile.displayName;
            bio = profile.bio;
            avatar = profile.avatar;
            privacy = profile.privacy;
          };
        };
      }
    );
  };

  public query ({ caller }) func getPublicUserProfile(userId : UserId) : async ?PublicUserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    if (isBlocked(caller, userId)) {
      return null;
    };

    let profile = users.get(userId);
    switch (profile) {
      case (null) { null };
      case (?profile) {
        if (profile.privacy == #profilePublic) {
          return ?{
            username = profile.username;
            displayName = profile.displayName;
            bio = profile.bio;
            avatar = profile.avatar;
            privacy = profile.privacy;
          };
        };
        if (isFollowing(caller, userId)) {
          return ?{
            username = profile.username;
            displayName = profile.displayName;
            bio = profile.bio;
            avatar = profile.avatar;
            privacy = profile.privacy;
          };
        };
        null;
      };
    };
  };

  public shared ({ caller }) func setProfilePrivacyLevel(privacy : ProfilePrivacy) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update privacy settings");
    };

    let profile = users.get(caller);
    switch (profile) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        users.add(caller, { profile with privacy });
      };
    };
  };

  public query ({ caller }) func getOnlineUsers() : async [PublicUserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view online users");
    };

    users.values().toArray().filter(
      func(user) {
        user.online and user.privacy == #profilePublic
      }
    ).map(
      func(profile) {
        {
          username = profile.username;
          displayName = profile.displayName;
          bio = profile.bio;
          avatar = profile.avatar;
          privacy = profile.privacy;
        };
      }
    );
  };

  func timerEvent() : async () {
    users.forEach(
      func(userId, profile) {
        if (profile.online) {
          users.add(userId, { profile with online = false });
        };
      }
    );
  };

  public shared ({ caller }) func initializeTimers() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize timers");
    };
    ignore Timer.recurringTimer<system>(#seconds 86400, timerEvent);
  };

  public query ({ caller }) func getSavedPosts() : async [Post.Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view saved posts");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User must be authenticated");
      };
      case (?user) {
        return user.savedPosts.filter(
          func(id) { posts.get(id) != null }
        ).map(
          func(id) {
            switch (posts.get(id)) {
              case (?p) { p };
              case (null) {
                Runtime.trap("Unexpected null after filtering");
              };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func savePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save posts");
    };

    let post = posts.get(postId);
    switch (post) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (isBlocked(caller, post.author)) {
          Runtime.trap("Cannot save post from blocked user");
        };
      };
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User must be authenticated");
      };
      case (?user) {
        if (user.savedPosts.find(func(id) { id == postId }) != null) {
          return;
        };

        let updatedUser = { user with savedPosts = user.savedPosts.concat([postId]) };
        users.add(caller, updatedUser);
      };
    };
  };

  public shared ({ caller }) func unsavePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unsave posts");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User must be authenticated");
      };
      case (?user) {
        if (user.savedPosts.find(func(id) { id == postId }) == null) {
          return;
        };

        users.add(
          caller,
          {
            user with
            savedPosts = user.savedPosts.filter(func(id) { id != postId })
          },
        );
      };
    };
  };

  public shared ({ caller }) func blockUser(target : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can block others");
    };

    if (caller == target) {
      Runtime.trap("Cannot block yourself");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User must be authenticated");
      };
      case (?user) {
        if (user.blockedUsers.find(func(id) { id == target }) != null) {
          return;
        };

        // Automatically unfollow both directions
        let updatedFollowing = user.following.filter(func(id) { id != target });
        let updatedFollowers = user.followers.filter(func(id) { id != target });

        let updatedUser = {
          user with
          blockedUsers = user.blockedUsers.concat([target]);
          following = updatedFollowing;
          followers = updatedFollowers;
        };
        users.add(caller, updatedUser);

        // Remove caller from target's following and followers
        switch (users.get(target)) {
          case (null) {};
          case (?targetUser) {
            let targetUpdatedFollowing = targetUser.following.filter(func(id) { id != caller });
            let targetUpdatedFollowers = targetUser.followers.filter(func(id) { id != caller });
            let targetUpdatedUser = {
              targetUser with
              following = targetUpdatedFollowing;
              followers = targetUpdatedFollowers;
            };
            users.add(target, targetUpdatedUser);
          };
        };
      };
    };
  };

  public shared ({ caller }) func unblockUser(target : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unblock others");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User must be authenticated");
      };
      case (?user) {
        if (user.blockedUsers.find(func(id) { id == target }) == null) {
          return;
        };

        users.add(
          caller,
          {
            user with
            blockedUsers = user.blockedUsers.filter(func(id) { id != target })
          },
        );
      };
    };
  };

  public query ({ caller }) func getBlockedUsers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view blocked users");
    };

    switch (users.get(caller)) {
      case (null) {
        Runtime.trap("User must be authenticated");
      };
      case (?user) { return user.blockedUsers };
    };
  };

  // ====== GROUP LOGIC =======
  public shared ({ caller }) func createGroup(name : Text) : async GroupId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create groups");
    };

    let newGroup : Group = {
      id = nextGroupId;
      name;
      members = [caller];
      creator = caller;
      pendingInvites = [];
    };

    groups.add(nextGroupId, newGroup);
    nextGroupId += 1;

    newGroup.id;
  };

  public shared ({ caller }) func inviteToGroup(groupId : GroupId, target : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can invite others to groups");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found.") };
      case (?group) {
        if (caller != group.creator) {
          Runtime.trap("Only group creator can send invites.");
        };

        // Check if already a member or invited
        if (group.members.find(func(member) { member == target }) != null) {
          Runtime.trap("User is already a member.");
        };

        if (group.pendingInvites.find(func(invitee) { invitee == target }) != null) {
          Runtime.trap("User has already been invited.");
        };

        let updatedGroup = {
          group with
          pendingInvites = group.pendingInvites.concat([target]);
        };
        groups.add(groupId, updatedGroup);
      };
    };
  };

  public shared ({ caller }) func acceptGroupInvite(groupId : GroupId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept group invites");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found.") };
      case (?group) {
        // Check if user was invited
        if (group.pendingInvites.find(func(invitee) { invitee == caller }) == null) {
          Runtime.trap("No pending invite found for this user.");
        };

        // Remove user from pending invites and add to group members
        let updatedInvites = group.pendingInvites.filter(func(invitee) { invitee != caller });
        let updatedMembers = group.members.concat([caller]);

        let updatedGroup = {
          group with
          pendingInvites = updatedInvites;
          members = updatedMembers;
        };
        groups.add(groupId, updatedGroup);
      };
    };
  };

  public shared ({ caller }) func declineGroupInvite(groupId : GroupId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can decline group invites");
    };

    switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found.") };
      case (?group) {
        // Check if user was invited
        if (group.pendingInvites.find(func(invitee) { invitee == caller }) == null) {
          Runtime.trap("No pending invite found for this user.");
        };

        // Remove user from pending invites without adding them to members
        let updatedInvites = group.pendingInvites.filter(func(invitee) { invitee != caller });
        let updatedGroup = { group with pendingInvites = updatedInvites };
        groups.add(groupId, updatedGroup);
      };
    };
  };

  public query ({ caller }) func getMyGroups() : async [Group] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their groups");
    };

    groups.values().toArray().filter(
      func(_group) {
        _group.members.find(func(member) { member == caller }) != null or
        _group.creator == caller
      }
    );
  };

  public query ({ caller }) func getGroupInvites() : async [Group] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their group invites");
    };

    groups.values().toArray().filter(
      func(_group) {
        _group.pendingInvites.find(func(invitee) { invitee == caller }) != null
      }
    );
  };

  // GROUP CHAT LOGIC
  public shared ({ caller }) func sendGroupMessage(groupId : GroupId, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send group messages");
    };

    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };

    let isMember = switch (group.members.find(func(member) { member == caller })) {
      case (null) { false };
      case (_) { true };
    };

    if (not isMember) { Runtime.trap("Must be a group member to send messages") };

    let groupMessage : GroupMessage = {
      groupId;
      sender = caller;
      content;
      timestamp = 0;
    };

    // Get current message list
    let messageList = switch (groupMessages.get(groupId)) {
      case (null) { List.empty<GroupMessage>() };
      case (?msgs) { msgs };
    };

    // Add message, persist messages to lifetime of group
    messageList.add(groupMessage);
    groupMessages.add(groupId, messageList);
  };

  public query ({ caller }) func getGroupMessages(groupId : GroupId) : async [GroupMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read group messages");
    };

    let group = switch (groups.get(groupId)) {
      case (null) { Runtime.trap("Group not found") };
      case (?group) { group };
    };

    if (group.members.find(func(member) { member == caller }) == null) {
      Runtime.trap("Must be a group member to retrieve messages");
    };

    switch (groupMessages.get(groupId)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };
  };
};

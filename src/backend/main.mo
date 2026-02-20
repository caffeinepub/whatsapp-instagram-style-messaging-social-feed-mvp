import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import Timer "mo:core/Timer";
import Order "mo:core/Order";
import Option "mo:core/Option";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
  public type UserId = Principal;
  public type Username = Text;
  public type PostId = Nat;
  public type ImageAssetUrl = Text;

  public type Post = {
    id : Nat;
    author : UserId;
    caption : Text;
    images : [ImageAssetUrl];
    timestamp : Int;
  };

  public type ConversationId = Nat;

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

  public type Conversation = {
    id : ConversationId;
    participants : [UserId];
    messages : [Message.Message];
  };

  public type UserProfile = {
    username : Username;
    displayName : Text;
    bio : Text;
    avatar : ?Blob;
    followers : [UserId];
    following : [UserId];
  };

  module UserProfile {
    public func compare(user1 : UserProfile, user2 : UserProfile) : Order.Order {
      Text.compare(user1.username, user2.username);
    };
  };

  // New structured search result type
  public type UserSearchResult = {
    principal : Principal;
    profile : UserProfile;
  };

  // Stable storage structures
  let users = Map.empty<UserId, UserProfile>();
  let posts = Map.empty<PostId, Post>();
  var nextPostId = 0;
  let conversations = Map.empty<UserId, List.List<ConversationId>>();
  let messages = Map.empty<ConversationId, List.List<Message.Message>>();
  var nextConversationId = 0;
  var nextMessageId = 0;

  // Initialize Access Control State and include Authorization Mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  /// Get caller's user profile (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  /// Get any user's profile (own profile or admin can view any)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  /// Save caller's user profile (required by frontend)
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    // Verify username uniqueness if changed
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

  /// User signup and onboarding flow (accessible to guests to create accounts)
  public shared ({ caller }) func signUp(username : Username, displayName : Text) : async () {
    // Check if username is already taken
    let existing = users.values().toArray().find(
      func(profile : UserProfile) : Bool { profile.username == username }
    );

    if (existing != null) {
      Runtime.trap("Username '" # username # "' has already been taken");
    };

    let userProfile : UserProfile = {
      displayName;
      username;
      bio = "";
      avatar = null;
      followers = [];
      following = [];
    };

    users.add(caller, userProfile);
  };

  /// Follows another user (requires user role)
  public shared ({ caller }) func followUser(userToFollow : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    if (caller == userToFollow) {
      Runtime.trap("Cannot follow yourself");
    };

    let callerProfile = users.get(caller);
    let targetProfile = users.get(userToFollow);

    if (targetProfile == null) { Runtime.trap("User does not exist") };
    if (callerProfile == null) { Runtime.trap("Caller must be signed up before following") };

    // Check if already following
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

  /// Unfollows another user (requires user role)
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

  /// Creates a new post with up to 10 images (requires user role)
  public shared ({ caller }) func createPost(caption : Text, images : [ImageAssetUrl]) : async PostId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    if (images.size() > 10) { Runtime.trap("Cannot upload more than 10 images per post") };

    let post : Post = {
      id = nextPostId;
      author = caller;
      caption;
      images;
      timestamp = 0;
    };

    posts.add(nextPostId, post);
    nextPostId += 1;
    post.id;
  };

  /// Retrieves a user's feed with posts from users they follow (requires user role)
  public query ({ caller }) func getFeed() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view feed");
    };

    let callerProfile = users.get(caller);

    let userPosts = posts.values().toArray().filter(
      func(post : Post) : Bool {
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

  /// Starts a new conversation with another user (requires user role)
  public shared ({ caller }) func startConversation(participant : UserId) : async ConversationId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start conversations");
    };

    if (caller == participant) {
      Runtime.trap("Cannot start conversation with yourself");
    };

    if (users.get(participant) == null) {
      Runtime.trap("Participant user does not exist");
    };

    // Check if conversation already exists between these two users
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

    // Add conversation to both participants
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

    // Initialize empty message list for this conversation
    messages.add(newConversationId, List.empty<Message.Message>());

    newConversationId;
  };

  /// Sends a message in a conversation (requires user role and participation)
  public shared ({ caller }) func sendMessage(conversationId : ConversationId, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    // Verify caller is participant in this conversation
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

    let allMessages = switch (messages.get(conversationId)) {
      case (null) { List.empty<Message.Message>() };
      case (?msgs) { msgs };
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

  /// Gets all messages for a conversation (requires user role and participation)
  public query ({ caller }) func getMessages(conversationId : ConversationId) : async [Message.Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };

    // Verify caller is participant in this conversation
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

  /// Lists all conversations for the caller (requires user role)
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

  /// Handles Internet Identity authentication and session management (requires user role)
  public shared ({ caller }) func authenticate() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required");
    };

    if (not users.containsKey(caller)) {
      Runtime.trap("User does not exist. Please sign up first.");
    };
  };

  /// Search for users by username (requires user role)
  public query ({ caller }) func searchUsers(searchTerm : Text) : async [UserSearchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for other users");
    };

    users.toArray().filter(
      func((principal, user)) {
        user.username.contains(#text searchTerm) or 
        user.displayName.contains(#text searchTerm)
      }
    ).map<(UserId, UserProfile), UserSearchResult>(
      func((principal, profile)) {
        {
          principal;
          profile;
        };
      }
    );
  };
};

import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  public type OldMessage = {
    id : Nat;
    sender : Principal;
    content : Text;
    timestamp : Int;
    read : Bool;
    conversationId : Nat;
  };

  public type OldActor = {
    users : Map.Map<Principal, {
      username : Text;
      displayName : Text;
      bio : Text;
      avatar : ?Blob;
      followers : [Principal];
      following : [Principal];
    }>;
    posts : Map.Map<Nat, {
      id : Nat;
      author : Principal;
      caption : Text;
      images : [Text];
      timestamp : Int;
    }>;
    nextPostId : Nat;
    conversations : Map.Map<Principal, List.List<Nat>>;
    messages : Map.Map<Nat, List.List<OldMessage>>;
    nextConversationId : Nat;
    nextMessageId : Nat;
  };

  public type NewActor = {
    users : Map.Map<Principal, {
      username : Text;
      displayName : Text;
      bio : Text;
      avatar : ?Blob;
      followers : [Principal];
      following : [Principal];
    }>;
    posts : Map.Map<Nat, {
      id : Nat;
      author : Principal;
      caption : Text;
      images : [Text];
      timestamp : Int;
    }>;
    nextPostId : Nat;
    conversations : Map.Map<Principal, List.List<Nat>>;
    messages : Map.Map<Nat, List.List<OldMessage>>;
    nextConversationId : Nat;
    nextMessageId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};

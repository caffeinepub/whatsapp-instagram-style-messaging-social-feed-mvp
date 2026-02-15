# Specification

## Summary
**Goal:** Deliver an MVP chat + social feed app with Internet Identity sign-in, basic profiles, an Instagram-like feed, and WhatsApp-like 1:1 messaging.

**Planned changes:**
- Add Internet Identity authentication with first-time onboarding to create a user record (display name, unique handle, optional bio and avatar URL) and allow profile viewing/editing.
- Implement backend data models + canister methods for user search, follow/unfollow, followers/following lists, creating posts (caption + up to 10 image URLs), listing my posts, and generating a reverse-chronological feed from self + followed users.
- Implement 1:1 direct messaging: create/get conversation by participant pair, list my conversations, send messages (text + optional single image URL), and list message history with pagination; enforce participant-only access.
- Build frontend pages and routing for Feed, Explore/Search, Messages (conversations + chat thread), Profile, and Create Post, with responsive navigation (mobile + desktop).
- Apply a consistent modern UI theme across the app (avoid blue/purple as the primary palette) and add validation plus loading/empty/error states across key views.
- Ensure stable canister storage across upgrades for users, follows, posts, conversations, and messages, with caller-based access control and clear error responses.

**User-visible outcome:** Users can sign in with Internet Identity, set up a profile with a unique handle, search and follow others, create image posts and browse a timeline feed, and start 1:1 chats with polling-based message updates.

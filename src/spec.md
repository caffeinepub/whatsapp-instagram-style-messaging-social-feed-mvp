# Specification

## Summary
**Goal:** Fix Explore user actions by ensuring search results include each user’s Principal ID so follow/unfollow and “Start chat” work reliably.

**Planned changes:**
- Backend: add/update an authenticated user search query that returns matched users including their Principal (UserId) plus the profile fields required by the Explore UI.
- Frontend (Explore): use the returned Principal (as text) to call follow/unfollow mutations; enable the buttons except while requests are in-flight; prevent following self; show backend errors to users in English.
- Frontend (Explore): enable “Start chat” for other users using the selected user’s Principal ID; navigate to the created conversation thread on success; show English errors on failure.
- Frontend (Explore): update the displayed follow relationship state immediately after follow/unfollow without a full page refresh.

**User-visible outcome:** In Explore, signed-in users can follow/unfollow other users and start chats directly from search results, with immediate UI updates and clear English error messages when something fails.

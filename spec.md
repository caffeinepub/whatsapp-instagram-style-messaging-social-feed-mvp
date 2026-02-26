# Specification

## Summary
**Goal:** Fix slow initial app load time by implementing lazy loading, a splash screen, async actor initialization, and optimized React Query caching.

**Planned changes:**
- Convert all route-level page components in `App.tsx` to use `React.lazy()` with `Suspense` boundaries and a lightweight fallback spinner
- Add a visually clean splash/loading screen in `RootLayout.tsx` that renders immediately on mount without depending on async data or actor initialization
- Make ICP backend actor initialization asynchronous so it does not block the first render of the app shell
- Configure the global `QueryClient` with appropriate `staleTime` and `cacheTime` values to avoid redundant backend calls on load and re-navigation

**User-visible outcome:** The app displays meaningful UI almost instantly on first load instead of a blank screen, and subsequent navigation feels faster due to cached query results and deferred chunk loading.

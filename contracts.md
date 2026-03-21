# KdM - API Contracts & Backend Integration Plan

## A) API Contracts

### Auth
- `POST /api/auth/register` - body: `{ username, email, password, displayName }` → `{ user, token }`
- `POST /api/auth/login` - body: `{ email, password }` → `{ user, token }`
- `GET /api/auth/me` - header: `Authorization: Bearer <token>` → `{ user }`

### Users
- `GET /api/users/:id` → `{ user }`
- `GET /api/users/username/:username` → `{ user, videos }`
- `PUT /api/users/me` - body: `{ displayName, bio, avatar }` → `{ user }`
- `POST /api/users/:id/follow` → `{ followed: bool }`
- `GET /api/users/:id/followers` → `[users]`
- `GET /api/users/:id/following` → `[users]`

### Videos
- `GET /api/videos/feed?page=1&limit=10` → `{ videos, hasMore }`
- `GET /api/videos/following?page=1` → `{ videos, hasMore }`
- `POST /api/videos` - multipart: `{ file, caption, hashtags, visibility, allowComments, allowDuet, allowStitch }` → `{ video }`
- `GET /api/videos/:id` → `{ video }`
- `DELETE /api/videos/:id` → `{ success }`
- `POST /api/videos/:id/like` → `{ liked: bool, likeCount }`
- `POST /api/videos/:id/bookmark` → `{ bookmarked: bool }`
- `POST /api/videos/:id/view` → `{ views }`

### Comments
- `GET /api/videos/:id/comments?page=1` → `{ comments, total }`
- `POST /api/videos/:id/comments` - body: `{ text }` → `{ comment }`
- `POST /api/comments/:id/like` → `{ liked, likeCount }`

### Discover
- `GET /api/discover/trending` → `{ hashtags, videos }`
- `GET /api/discover/creators` → `{ creators }`
- `GET /api/search?q=query&type=all|users|videos` → `{ users, videos }`

### Notifications
- `GET /api/notifications` → `{ notifications }`

## B) Mock Data to Replace
From `mockData.js`:
- `currentUser` → from `/api/auth/me`
- `users` → from `/api/discover/creators` and `/api/users/*`
- `videos` → from `/api/videos/feed`
- `comments` → from `/api/videos/:id/comments`
- `trendingHashtags` → from `/api/discover/trending`
- `notifications` → from `/api/notifications`
- `suggestedAccounts` → from `/api/discover/creators`
- `formatNumber` → keep as frontend utility

## C) Backend Implementation
1. MongoDB models: users, videos, comments, likes, follows, bookmarks, notifications
2. JWT auth middleware
3. File upload with python-multipart (video storage in /app/backend/uploads/)
4. CRUD for all entities
5. Feed algorithm (chronological + following)
6. Search with MongoDB text index

## D) Frontend-Backend Integration
1. Create `api.js` service with axios interceptors for auth token
2. Replace mock imports in each page with API calls
3. Add AuthContext for user state management
4. Add loading states and error handling
5. Keep `formatNumber` utility on frontend

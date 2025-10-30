# Pally Traders

## Overview

Pally Traders is a competitive prediction game with a "fantasy sports for degens" concept. Users make daily predictions about crypto markets, crowd consensus, and preferences to earn Alpha points and climb leaderboards. The application combines elements of trading terminals with mobile gaming aesthetics, featuring a dark neon theme with turquoise and magenta gradients.

The core mechanic revolves around predicting what the crowd will think or choose rather than actual market outcomes, creating a cultural forecasting game. Users answer one multiple-choice question at a time and can choose Public voting (×2 point multiplier) or Private voting (×1 point multiplier). Rare (minority) correct predictions earn higher base points.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 30, 2025 (Critical Bug Fixes)**: Fixed question display, auto-reveal, and results calculation
- **Question Display Bug**: Fixed duplicate questions appearing on homepage
  - Added limit of 3 questions per 24-hour period (12 PM ET to 12 PM ET)
  - Questions now properly filtered by current 24-hour cycle
  - Updated `getActiveQuestions()` to enforce maximum 3 questions per day
- **Automatic Question Reveal**: Questions now automatically marked as revealed when revealsAt time passes
  - Added `checkAndRevealQuestions()` helper function
  - Called automatically in `/api/questions/active`, `/api/questions/revealed`, and `/api/results/:questionId` endpoints
  - No manual admin action needed to reveal questions
- **Results Calculation**: Points and multipliers now properly stored on vote records
  - Added `updateVote()` method to storage layer
  - Results endpoint now updates each vote with `pointsEarned` and `multiplier` fields
  - Profile history now correctly shows earned points and multipliers for revealed questions
  - User alpha points automatically updated when results are first calculated
- **Home Page Loading**: Fixed race condition on first load
  - Added 300ms delay before enabling profile query to ensure Privy user ID is set
  - Increased retry attempts from 1 to 3 with exponential backoff (1s, 2s, 3s)
  - Added 1-minute cache for user profile to reduce repeated requests
  - Prevents premature "Unable to load profile" errors
- **ET Timezone Calculation**: Fixed timezone offset calculation in getActiveQuestions()
  - Properly detects EDT vs EST using timeZoneName
  - Correctly converts ET noon to UTC for database queries
  - Handles DST transitions accurately

**October 29, 2025 (Legal Pages)**: Added Terms of Service and Privacy Policy
- **Legal Documents**: Created comprehensive legal pages
  - Terms of Service page at `/terms` with 13 sections covering usage rules, game mechanics, prohibited conduct, IP rights, disclaimers, and liability
  - Privacy Policy page at `/privacy` with 13 sections covering data collection, usage, sharing, security, and user rights
- **Public Access**: Legal pages accessible without authentication
  - Updated authentication redirect logic to allow `/terms` and `/privacy` for unauthenticated users
  - Users can access legal documents before signing up
- **Footer Component**: Added global footer with legal links
  - Displays on all authenticated pages (hidden on splash, create-profile, admin, and legal pages)
  - Links to Terms of Service and Privacy Policy
  - Copyright notice
- **Splash Page Integration**: Updated splash page with working legal links
  - Fixed wouter Link usage (removed nested anchor tags)
  - Terms and Privacy links in splash page footer
- **Navigation**: "Back to Profile" buttons on legal pages redirect unauthenticated users to `/splash`

**October 28, 2025 (Admin Interface)**: Added manual question management system
- **Admin Dashboard**: New `/admin` route accessible via Settings icon in TopBar
- **Question Creation Form**: 
  - Create questions with type (consensus/prediction/preference)
  - Set prompt, options (A/B required, C/D optional), and optional context
  - Schedule dropsAt and revealsAt times
  - Form validation and reset after successful creation
- **Question Management**: 
  - View all questions ordered by drop date
  - Delete questions (blocked if question has votes - returns 409 error)
  - Visual badges for question status (Revealed, Inactive)
- **Admin API Endpoints** (all require isAdmin=true):
  - GET /api/admin/questions - Fetch all questions
  - POST /api/admin/questions - Create new question
  - DELETE /api/admin/questions/:id - Delete question (fails with 409 if votes exist)
- **Storage Layer**: 
  - Added getAllQuestions() and deleteQuestion() methods
  - Added getQuestionVotesCount() for optimized vote checking
- **Authorization**:
  - Added `isAdmin` boolean field to users table (defaults to false)
  - All admin endpoints check user.isAdmin, return 403 if not admin
  - Frontend gates admin queries and shows "Access Denied" for non-admins
- **Promoting Users to Admin**:
  - Use SQL to promote a user: `UPDATE users SET is_admin = true WHERE handle = 'your_handle';`
  - Or use Privy user ID: `UPDATE users SET is_admin = true WHERE privy_user_id = 'privy_user_id';`

**October 28, 2025 (Navigation Redesign)**: Complete navigation and branding overhaul
- **New Global TopBar**: 
  - Left: α Points counter with gradient pill (replaces all ⚡ lightning bolts)
  - Center: "PALLY ARENA" clickable logo (returns to Home) with universal timer
  - Right: Leaderboard + Profile icon buttons
  - Sticky at top across all pages
- **Universal 24-Hour Timer**: 
  - Single global timer in TopBar: "Next Question in HH:MM:SS"
  - Properly handles DST transitions (detects EDT vs EST for target date)
  - Counts down to 12:00 PM ET (noon) daily
  - Removed per-question countdown timers from cards
- **Alpha Symbol (α) Branding**:
  - Replaced all lightning bolt (⚡) icons with alpha symbol (α)
  - Consistent across TopBar, results, profile history, leaderboard
  - Emphasizes "Alpha points" terminology
- **Rank System on Profile**:
  - Progress bar showing rank advancement (Bronze → Silver → Gold → Platinum → Diamond)
  - Tiers: Bronze (0-499), Silver (500-999), Gold (1000-1999), Platinum (2000-4999), Diamond (5000+)
  - Next tier display with points needed
- **7-Day Season Countdown**:
  - Leaderboard shows countdown to season end
  - Proper rolling 7-day cycle from epoch (Jan 1, 2024 12pm ET)
  - Format: "Season ends in X days Y hours"
- **Post-Vote UX Fix**: After voting, immediately shows selected answer highlighted + locked state (no blank screen)

**October 28, 2025 (Spec v2)**: Completed full spec v2 implementation
- **Game Mechanics Update**: Removed daily vote allocation (no 5 votes/day cap), now one answer per question per user
- **Multiplier System**: Public votes = ×2 points, Private votes = ×1 point
- **UI/UX Enhancements**: 
  - Implemented Public/Private toggle with live multiplier pill (α×2 or α×1)
  - Added helper text explaining visibility
  - Enhanced Profile page history with detailed vote information
  - Added Daily/Weekly/All-time tabs to Leaderboard
- **Question Reset Time**: Questions drop and reveal at 12:00 PM ET (noon), not midnight

**October 28, 2025 (Initial)**: Completed full backend integration
- Implemented complete database storage layer (DbStorage) replacing in-memory storage
- Created all API routes for users, questions, voting, results, and leaderboard
- Connected all frontend pages to use backend APIs with React Query
- Implemented rarity multiplier scoring system
- Created seed endpoint for test questions
- Fixed database schema to auto-generate UUIDs for user IDs
- All pages now use real data from PostgreSQL database

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Styling**: 
- Tailwind CSS with custom design system
- shadcn/ui component library (New York style variant)
- Custom color palette defined in CSS variables supporting dark mode
- Design philosophy emphasizes "one core decision per screen" with minimal clutter
- Responsive design using mobile-first approach with tab bar navigation on mobile and standard navigation on desktop

**State Management**:
- TanStack React Query for server state and API interactions
- Local React state for UI interactions
- Custom query client with specific error handling for 401 responses

**Routing**: Wouter for lightweight client-side routing

**Key Design Decisions**:
- Component-based architecture with reusable UI primitives
- Framer Motion for animations and transitions (points bursts, result reveals)
- Separation of concerns between pages, components, and UI primitives
- Design guidelines enforce energetic, competitive feel with countdown timers and hidden results for tension

### Backend Architecture

**Server Framework**: Express.js with TypeScript

**API Structure**:
- RESTful API pattern with `/api` prefix for all routes
- DbStorage implementation connected to PostgreSQL database
- Storage interface defines CRUD operations for users, questions, votes, results, and leaderboard
- Route registration separated into dedicated routes module
- Authentication via Privy user ID passed in x-privy-user-id header

**Session Management**:
- Express sessions configured (connect-pg-simple for PostgreSQL session store)
- Cookie-based authentication

**Design Decisions**:
- Storage abstraction pattern with DbStorage implementation for PostgreSQL
- Middleware for request logging with duration tracking
- One answer per question per user (no daily vote allocation)
- Public votes earn ×2 multiplier, Private votes earn ×1 multiplier
- Automatic results calculation on first fetch after reveal time
- Rarity multiplier scoring (inverse of percentage)
- Questions reset at 12:00 PM ET (noon)
- Separation of server setup, routing, and storage concerns

**API Endpoints**:
- User: GET /api/user/me, POST /api/user/profile, PATCH /api/user/profile
- Questions: GET /api/questions/active, GET /api/questions/revealed, GET /api/questions/:id, POST /api/questions
- Votes: POST /api/votes, GET /api/votes/mine, GET /api/votes/:questionId/mine
- Results: GET /api/results/:questionId (auto-calculates if needed)
- Leaderboard: GET /api/leaderboard
- Admin: GET /api/admin/questions, POST /api/admin/questions, DELETE /api/admin/questions/:id
- Seed: POST /api/seed/questions (development only)

### Data Storage Solutions

**Database**: PostgreSQL via Neon serverless

**ORM**: Drizzle ORM with the following schema design:

**Users Table**:
- Stores Privy authentication user IDs
- Tracks alpha points, streaks (current and max), rank, and badges
- Handle (username) with uniqueness constraint

**Questions Table**:
- Support for three question types: consensus, prediction, preference
- Multiple choice options (A, B, C, D with C/D optional)
- Temporal fields: dropsAt, revealsAt for game mechanics
- Active/revealed state tracking

**Votes Table**:
- Links users to questions with their choice
- Supports vote allocation (multiple votes per question)
- Public/private voting with different point rewards
- Post-reveal calculation of points earned and multipliers

**Design Rationale**:
- Zod schemas for type-safe validation
- UUID primary keys for security and scalability
- Timestamp tracking for audit trails
- Array fields for badges to support multiple achievements
- Separate revealed state from active state for temporal game mechanics

### Authentication and Authorization

**Provider**: Privy for Web3 and social authentication

**Supported Methods**:
- Wallet connections (Web3)
- Social logins (Twitter/X, Google, Discord)
- Email authentication

**Flow**:
- Splash screen with multiple auth options
- Post-authentication profile creation if first-time user
- Session-based authentication with secure cookies
- Privy user ID stored and linked to internal user records

**Design Decisions**:
- Privy handles complex auth flows, reducing custom auth code
- Separation of Privy user identity from application user profile
- localStorage used for client-side profile state (temporary until backend integration)

### External Dependencies

**Authentication**: 
- @privy-io/react-auth for wallet and social authentication

**Database**:
- @neondatabase/serverless for PostgreSQL connections
- Drizzle ORM for type-safe database queries
- WebSocket constructor override for Neon serverless compatibility

**UI Framework**:
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- React Icons for brand icons

**Development Tools**:
- Vite with React plugin
- TypeScript for type safety
- ESBuild for production builds
- Replit-specific plugins (runtime error overlay, cartographer, dev banner)

**Design Decisions**:
- Heavy reliance on Radix UI ensures accessibility without custom implementation
- Neon serverless chosen for easy database provisioning in Replit environment
- Privy selected for comprehensive Web3 + Web2 authentication needs
- shadcn/ui pattern allows component customization while maintaining consistency
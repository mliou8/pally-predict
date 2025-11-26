# Pally Traders

## Overview
Pally Traders is a competitive prediction game inspired by "fantasy sports for degens," where users predict crypto market sentiment, crowd consensus, and preferences daily. The goal is to earn Alpha points and climb leaderboards by making accurate predictions on multiple-choice questions. The game emphasizes cultural forecasting over direct market outcomes, utilizing a dark neon aesthetic with turquoise and magenta gradients, blending trading terminal functionality with mobile gaming UI. Users can choose Public voting (x2 multiplier) or Private voting (x1 multiplier), with rare correct predictions yielding higher base points.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

**November 26, 2025 (Solana Wallet Integration - Phase 2)**: Complete real-money betting with on-chain verification
- **Secure Wallet Linking**: Cryptographic signature verification with replay attack prevention
  - Message format: `PALLY|link|privy:{userId}|addr:{address}|nonce:{nonce}|ts:{iso}`
  - Nonces scoped to user/address pair, expire after 5 minutes, single-use
  - 409 conflict returned for duplicate wallet addresses
  - tweetnacl + @solana/web3.js PublicKey for signature verification
- **On-Chain Transaction Verification**: `/api/wager/verify` validates deposits
  - Fetches transaction from Solana RPC (devnet by default)
  - Verifies sender matches user's linked wallet
  - Validates escrow address receives correct amount
  - Checks transaction succeeded (no errors)
  - Records transaction signature for audit trail
- **Wager Flow**: Initiate → Sign → Verify pattern
  - POST `/api/wager/initiate`: Creates vote, returns escrow address and memo
  - User sends SOL to escrow with memo: `PALLY|vote:{id}|q:{qid}|u:{uid}|amt:{lamports}`
  - POST `/api/wager/verify`: On-chain validation before confirming wager
- **Settlement Idempotency**: Prevents double-awarding on repeated API calls
  - Checks if any vote already has `pointsEarned` set before processing
  - Results calculation only runs once per question reveal
- **BigInt Serialization**: All API responses safely serialize BigInt fields
  - Helper `serializeBigInt()` recursively converts BigInt to strings
  - Applied to: /api/votes, /api/results, /api/user/stats, /api/wager/*
- **LinkWallet Page**: Mandatory wallet connection after profile creation
  - Navigation gating requires wallet before accessing main app
  - Secure message signing with wallet address included in payload
- **Profile Page Stats**: SOL earnings displayed
  - Total wagered, total earned, profit (in SOL)
  - Stats calculated from settled votes
- **Admin Panel**: Simplified to 1 daily question
  - Fast-track feature for testing
  - isAdmin flag required

**November 26, 2025 (Solana Wallet Integration - Phase 1)**: Added Phantom wallet connection for SOL betting
- **Solana Infrastructure**: Custom SolanaWalletProvider using direct Phantom API integration
  - Direct integration with Phantom browser extension via `window.solana`
  - No dependency on wallet adapter packages (simplified implementation)
  - Devnet connection for development/testing
  - Custom React context providing wallet state and actions
- **Splash Page Updates**: Added "Connect Phantom Wallet" button
  - Purple gradient styling matching Phantom branding
  - Dynamic button text: "Connect Phantom Wallet" or "Install Phantom Wallet"
  - Auto-redirect to profile creation on successful connection
  - Wallet connection alongside existing Privy social logins
- **Currency Migration**: Changed from ETH to SOL throughout the app
  - PromptCard: Wager input now shows "SOL" instead of "ETH"
  - ResultsReveal: All betting results display in SOL
  - Unit conversion: 1 SOL = 1e9 lamports (previously 1 ETH = 1e18 wei)
- **Database Schema**: Extended for Solana integration
  - `solana_address` (text): User's linked Solana wallet address
  - `wager_tx_sig` (text): Transaction signature for wager deposits
  - `payout_tx_sig` (text): Transaction signature for payout distributions
- **Technical Implementation**:
  - Buffer polyfill added in index.html for Solana web3.js browser compatibility
  - useSolanaWallet() hook provides: connected, connecting, publicKey, connection, connect, disconnect, signMessage
  - Phase 1 simulates betting without actual on-chain transactions (centralized escrow approach planned)

**November 19, 2025 (Crypto Betting Integration)**: Added SOL wagering system for predictions
- **Betting Mechanism**: Users can now wager SOL on their predictions to demonstrate conviction
  - Optional wager input in PromptCard with SOL amount field
  - Wagers stored in lamports (BigInt) for precision: 1 SOL = 10^9 lamports
  - Frontend converts SOL input to lamports before sending to backend
- **Payout Distribution**: Winners split total pot proportionally based on their wager amounts
  - Winning choice determined by highest vote count
  - Payout calculation: `(totalPot * userWager) / totalWinningWagers`
  - Pure BigInt arithmetic prevents precision loss for large lamports values
  - Losers receive no payout (wager goes to winners)
- **Results Display**: ResultsReveal component shows comprehensive betting statistics
  - User's wager amount displayed in SOL
  - Payout amount shown for winners (in SOL)
  - Total pot size visible to all users
  - Animated gradient cards for visual appeal
- **Database Schema**: Extended votes and question_results tables
  - `wager_amount` (bigint): User's wager in lamports, default 0
  - `payout_amount` (bigint, nullable): Calculated payout for winners
  - `total_pot` (bigint): Sum of all wagers on a question
- **Technical Implementation**:
  - BigInt JSON serialization via `BigInt.prototype.toJSON`
  - Idempotency guard prevents re-awarding points on repeated API calls
  - Results calculation checks if votes already have `pointsEarned` set
  - MVP implementation simulates betting without actual blockchain transactions

**November 03, 2025 (Profile Page Redesign)**: Hero-style ranking display with visual tier progression
- **Hero Rank Display**: Prominent showcase of current rank, emoji, and Alpha points
  - Large gradient card with user avatar and handle
  - Current rank displayed with emoji and gradient text
  - Alpha points highlighted with dual-color gradient (primary to magenta)
  - Progress bar showing advancement to next rank with points remaining
- **Stats Grid**: Three-column responsive grid (stacks on mobile)
  - Win Rate (placeholder at 0%)
  - Current Streak (live data)
  - Max Streak (historical best)
- **Tier Progression System**: Visual overview of all 5 ranks
  - Shows Bronze → Silver → Gold → Platinum → Diamond
  - Current rank highlighted with gradient accent
  - Unlocked ranks marked with green success badge
  - Locked ranks dimmed to show future progression
- **Responsive Design**: Fully mobile-optimized layout
  - Grid stacks on mobile (grid-cols-1 sm:grid-cols-3)
  - Text sizes scale (text-2xl sm:text-3xl)
  - Rank showcase flexes column on mobile
- **Testing Instrumentation**: Comprehensive data-testid coverage for all interactive elements and display stats

**November 02, 2025 (Results Tab Enhancement)**: Automatic display of all previous results
- **Results Tab**: Now automatically displays all revealed questions without requiring navigation
  - Removed "View All Results" button - all results shown inline
  - Questions where user voted: Full ResultsReveal component with points and multiplier
  - Questions where user didn't vote: Summary view with majority prediction and ranked options
  - Consistent UI with ranked emojis (🥇🥈🥉) and percentage bars
- **User Experience**: Simplified navigation - no need to click through to /all-results page
  - All historical results visible in one place
  - Better visibility of community predictions on questions user missed

**November 02, 2025 (Leaderboard Accuracy)**: Implemented accuracy calculation for leaderboard
- **Accuracy Calculation**: Leaderboard now displays each user's prediction accuracy
  - Accuracy = (correct votes / total votes on revealed questions) * 100
  - Correct vote = user picked the winning option (highest vote count)
  - Only counts votes on questions with calculated results
  - Users with no votes show 0% accuracy
- **Performance Optimization**: Batch-loading question results for efficient calculation
  - Single query to load all revealed question results upfront
  - In-memory map for O(1) result lookups
  - Improved from 3.6s to 655ms for 10 users (5.5x faster)
- **Frontend Display**: Updated LeaderboardRow components to show calculated accuracy
  - All three tabs (Daily/Weekly/All-time) display accuracy percentages
  - Current user's row shows their personal accuracy

## System Architecture

### Frontend Architecture
The frontend uses React with TypeScript, built with Vite. Styling is handled by Tailwind CSS with a custom design system and shadcn/ui components, featuring a dark mode and a mobile-first responsive design. State management leverages TanStack React Query for server interactions and local React state for UI. Wouter handles client-side routing. Key design decisions include a component-based architecture, Framer Motion for animations, and a focus on an energetic, competitive user experience with countdown timers.

### Backend Architecture
The backend is built with Express.js and TypeScript, following a RESTful API pattern. It uses a DbStorage implementation connected to a PostgreSQL database via Drizzle ORM for CRUD operations on users, questions, votes, results, and leaderboards. Authentication is managed using Privy user IDs passed in the `x-privy-user-id` header, with Express sessions for session management. Design principles include storage abstraction, middleware for request logging, automatic results calculation, rarity multiplier scoring, and a fixed 12:00 PM ET question reset time.

### Data Storage Solutions
PostgreSQL, hosted on Neon serverless, is the primary database. Drizzle ORM defines the schema, which includes tables for Users (Privy IDs, Alpha points, rank, handle), Questions (consensus, prediction, preference types; options A-D; `dropsAt`, `revealsAt` timestamps), and Votes (user-question linkage, choice, public/private status, calculated points/multipliers). The schema uses Zod for validation, UUID primary keys, and timestamp tracking.

### Authentication and Authorization
Privy provides comprehensive authentication supporting Web3 wallets, social logins (Twitter/X, Google, Discord), and email. The flow involves a splash screen with multiple auth options, followed by profile creation for new users. Privy user IDs are linked to internal user records, separating Privy's identity management from the application's user profiles.

## External Dependencies

*   **Authentication**: `@privy-io/react-auth`
*   **Blockchain**: `@solana/web3.js` (Solana), Phantom wallet via browser API
*   **Database**: `@neondatabase/serverless` (PostgreSQL), Drizzle ORM
*   **UI Framework**: Radix UI, Tailwind CSS, Framer Motion, Lucide React, React Icons
*   **Development Tools**: Vite, TypeScript, ESBuild
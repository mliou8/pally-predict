# Pally Traders

## Overview

Pally Traders is a competitive prediction game with a "fantasy sports for degens" concept. Users make daily predictions about crypto markets, crowd consensus, and preferences to earn Alpha points and climb leaderboards. The application combines elements of trading terminals with mobile gaming aesthetics, featuring a dark neon theme with turquoise and magenta gradients.

The core mechanic revolves around predicting what the crowd will think or choose rather than actual market outcomes, creating a cultural forecasting game. Users receive 5 votes per day to allocate across multiple-choice questions, with rare (minority) correct predictions earning higher point multipliers.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- Currently using in-memory storage abstraction (MemStorage) that can be swapped for database implementation
- Storage interface defines CRUD operations for users and related entities
- Route registration separated into dedicated routes module

**Session Management**:
- Express sessions configured (connect-pg-simple for PostgreSQL session store)
- Cookie-based authentication

**Design Decisions**:
- Storage abstraction pattern allows switching between in-memory and database implementations
- Middleware for request logging with duration tracking
- Raw body preservation for webhook verification
- Separation of server setup, routing, and storage concerns

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
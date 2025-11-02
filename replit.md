# Pally Traders

## Overview
Pally Traders is a competitive prediction game inspired by "fantasy sports for degens," where users predict crypto market sentiment, crowd consensus, and preferences daily. The goal is to earn Alpha points and climb leaderboards by making accurate predictions on multiple-choice questions. The game emphasizes cultural forecasting over direct market outcomes, utilizing a dark neon aesthetic with turquoise and magenta gradients, blending trading terminal functionality with mobile gaming UI. Users can choose Public voting (x2 multiplier) or Private voting (x1 multiplier), with rare correct predictions yielding higher base points.

## User Preferences
Preferred communication style: Simple, everyday language.

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
*   **Database**: `@neondatabase/serverless` (PostgreSQL), Drizzle ORM
*   **UI Framework**: Radix UI, Tailwind CSS, Framer Motion, Lucide React, React Icons
*   **Development Tools**: Vite, TypeScript, ESBuild
# Pally Predict — Design Guidelines

## Design Philosophy

**Core Feel**: Energetic, competitive, social, and clean — a blend of trading terminal + mobile game. One core decision per screen (no clutter). Keep tension through hidden results and countdown timers. Emphasize feedback loops through motion, streaks, and sound.

---

## Color System

- **Background**: `#0B0B0E` (deep charcoal/black)
- **Surface**: `#13131A`
- **Surface Muted**: `#191923`
- **Text Primary**: `#E8EAF2`
- **Text Secondary**: `#A1A7B3`
- **Brand Turquoise**: `#2BFBD2`
- **Brand Magenta**: `#E652F8`
- **Success**: `#39D98A`
- **Danger**: `#FF5C7C`
- **Warning**: `#FFB020`
- **Gold Glow**: `#FFEA80` (victory/Alpha Rank highlights)
- **Divider**: `#22222B`

Use neon gradients for highlights and CTAs. Muted gray text for non-active states.

---

## Typography

- **Display/Titles**: Space Grotesk (700/600 weights) — tech, futuristic feel
- **Body**: Inter (400/500/600 weights) — optimal readability
- **Numbers/Scores/Mono**: JetBrains Mono — gives quant + gamer vibe

**Hierarchy**:
- Hero questions: `text-2xl md:text-3xl font-semibold`
- Section headers: `text-xl font-semibold`
- Body: `text-base font-medium`
- Small labels: `text-xs font-semibold`

---

## Layout System

- **Mobile**: 4-pt grid with safe-area insets respected
- **Desktop**: 12-column grid, 80–1120px content container (`max-w-7xl mx-auto px-4 md:px-6`)
- **Border Radius**: `rounded-3xl` (24px), `rounded-2xl` (16px), `rounded-xl` (12px)
- **Shadows**: `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`
- **Spacing**: Tailwind default scale (4, 6, 8, 12, 16, 20, 24 units)

---

## Component Design Patterns

### Cards
All major content cards use:
- Background: `bg-[#13131A]`
- Border: `border border-[#22222B]`
- Padding: `p-6 md:p-8`
- Radius: `rounded-3xl`
- Shadow: `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`

### Buttons
- Vote/Primary: `rounded-2xl` with `bg-[#191923]`, `hover:bg-[#20202A]`, `border border-[#22222B]`
- Brand CTAs: Use gradient backgrounds with turquoise/magenta
- Lock state: Disabled with checkmark, muted colors

### Badges & Pills
- Small tags: `text-xs font-semibold px-2.5 py-1 rounded-full bg-[#191923]`
- Rank chips: Use tier-specific glow effects (bronze/silver/gold/oracle)
- Emoji badges: 🔥 (streak), 🧠 (accuracy), 🕵️ (private mode)

---

## Iconography

- Use Lucide or Remix icon libraries (minimal line icons)
- Animated reaction icons for results: 🔥 (fire), 🧠 (brain), 🥶 (cold face)
- Size: 20-24px for inline, 32-40px for feature icons

---

## Navigation Structure

### Mobile (Bottom Tab Bar)
- Fixed bottom navigation: 🏠 Home | 🏆 Leaderboard | 📊 History | 👤 Profile
- Active tab gets gradient underline
- Style: `bg-[#13131A]/90 backdrop-blur border-t border-[#22222B]`

### Desktop (Side Navigation)
- Vertical sidebar with icons + labels
- Collapsible option

### Top Bar
- Left: Alpha points pill (total)
- Center: Title + countdown ("PALLY ARENA — 12:00 PM DROP")
- Right: 🔔 Bell icon (notifications)
- Style: `sticky top-0 bg-[#0B0B0E]/80 backdrop-blur border-b border-[#22222B]`

---

## Motion & Animation

- **Timing**: 200–300ms ease-out for most transitions
- **Spring**: Use Framer Motion spring for reveal animations
- **Key Moments**:
  - Vote lock: Instant haptic + slide-up confirmation
  - Results reveal: Background glow → chart slide-up → confetti
  - Points burst: Scale + glow effect
  - Countdown: Live updating with subtle pulse on final seconds
- **Accessibility**: Disable all decorative animations for `prefers-reduced-motion`

---

## Screen-Specific Layouts

### Home — Live Prompt Arena
- Full-width prompt card with category tag at top
- Large centered question text
- Countdown timer (red/orange glow when < 1 hour)
- Two prominent vote buttons (A/B options)
- Vote type toggle below buttons (Public/Private with tooltip)
- Post-vote state: "Locked ✅" with timer, no crowd data visible

### Results Reveal
- Animated "Results Revealed!" header
- Horizontal stacked bar chart showing crowd split percentage
- Outcome verdict pill (✅/❌)
- Points animation: `+{points} α (rarity ×{multiplier})`
- Visual confetti effect
- Share card CTA button

### Leaderboard
- Tabs: This Week | All-Time | Guilds
- Grid rows: `grid-cols-[40px_1fr_auto]` with rank, avatar, handle, stats
- Highlight user's own row (sticky at bottom on mobile)
- Hover state: `hover:bg-[#191923]`

### Profile
- Header with avatar, handle, Alpha Rank chip
- Stats grid showing win rate, streak, total points
- Tabs: Public History | Private History | Badges
- History cards show question, choice, outcome, points

---

## Images

**No hero images needed.** This is a data-driven, game-like interface focused on cards, stats, and interaction. All visual interest comes from:
- Neon gradient accents
- Animated reveals and charts
- Badge/rank iconography
- User avatars in leaderboards

---

## Accessibility

- All interactive elements keyboard focusable: `focus:ring-2 focus:ring-[#2BFBD2]`
- High-contrast mode available (switches gradients to solid colors)
- Live regions for countdown and reveal announcements
- `aria-live="polite"` on countdown timers
- Motion reduction respected

---

## Empty & Error States

- **No active prompt**: "Next drop in 02:14:12" with countdown
- **Out of votes**: Modal explaining limit with "Return tomorrow" CTA
- **Network error**: Toast "Connection lost. Retrying…"
- **Loading states**: Skeleton screens matching card structure

---

## Key UX Principles

1. **Hidden Sentiment**: Never show crowd percentages until window closes
2. **Countdown Omnipresent**: Always visible when prompt is live
3. **Instant Feedback**: Vote lock happens immediately with haptic/sound
4. **Suspense to Dopamine**: Build tension pre-reveal, deliver celebration at reveal
5. **One Decision Per Screen**: No clutter, clear singular action
6. **Streak Emphasis**: Make winning streaks feel rewarding with 🔥 indicator
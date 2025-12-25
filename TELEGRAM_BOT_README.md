# Pally Predict Telegram Bot

A Telegram-based prediction game where users start with $500 testnet dollars and bet on daily prediction questions.

## Features

- **Daily Questions**: One prediction question per day
- **Testnet Dollars**: Users start with $500 balance
- **Betting System**: Users bet on their predictions
- **Winner Takes All**: Winners split the pot proportionally
- **Daily Reminders**: Results are sent the next day with:
  - The correct answer
  - Percentage of votes for each option
  - Amount of $ bet on each option
  - Your personal result and new balance

## Bot Commands

- `/start` - Register and get $500 to start
- `/question` - See today's prediction question
- `/balance` - Check your balance
- `/stats` - View your stats and accuracy
- `/leaderboard` - See top players
- `/history` - View your past bets
- `/help` - Show help message

## Setup

### 1. Create a Telegram Bot

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token you receive

### 2. Environment Variables

Add these to your `.env` file:

```env
# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Admin key for the admin panel (change this!)
TELEGRAM_ADMIN_KEY=your_secret_admin_key
```

### 3. Database Migration

Run the database migration to create the Telegram tables:

```bash
npm run db:push
```

### 4. Start the Server

```bash
npm run dev
```

The Telegram bot will automatically start when the server starts (if `TELEGRAM_BOT_TOKEN` is set).

## Admin Panel

Access the admin panel at: `/telegram-admin`

You'll be prompted for the admin key (set via `TELEGRAM_ADMIN_KEY` env var).

### Admin Features

1. **Dashboard**: View stats (users, questions, balances, wagers)
2. **Questions**: Manage all questions
   - View pending, active, and revealed questions
   - See betting stats for each question
3. **Create**: Add new questions
   - Set question text and options (2-4)
   - Set send time and expiration time
4. **Users**: View all registered users
   - See balances, win rates, streaks
5. **Actions**:
   - **Send**: Manually activate and broadcast a question
   - **Reveal**: Set the correct answer and distribute winnings
   - **Run Scheduler**: Force-run the automatic scheduler

## How It Works

### Daily Flow

1. **9 AM**: Question is automatically sent to all users
2. **Users vote**: Pick an option and place a bet ($1 minimum)
3. **9 PM**: Voting closes
4. **Next day**: Admin reveals the correct answer
5. **Winners notified**: Results sent with payouts

### Payout Calculation

- Winners split the total pot proportionally to their bet amounts
- If you bet $100 and the total winning bets are $400, you get 25% of the pot

### Example

Question: "Will BTC close above $100k this week?"
- Total pot: $1000
- Option A (Yes): $600 bet by 3 users
- Option B (No): $400 bet by 2 users

If A is correct:
- User who bet $200 gets: ($200/$600) × $1000 = $333.33
- User who bet $300 gets: ($300/$600) × $1000 = $500.00
- User who bet $100 gets: ($100/$600) × $1000 = $166.67

## Scheduler

The bot includes an automatic scheduler that runs every minute:

1. **Activates questions**: Sends scheduled questions when it's time
2. **Reveals questions**: Processes results when questions expire (if correct answer is set)
3. **Sends results**: Notifies users of their results

You can also manually trigger these actions from the admin panel.

## Database Schema

### telegram_users
- User info (telegram_id, username, name)
- Balance tracking
- Stats (predictions, accuracy, streaks)

### telegram_questions
- Question text and options
- Scheduling (send time, expiration)
- Status (active, revealed)
- Correct answer

### telegram_bets
- User's choice and bet amount
- Result (correct/incorrect)
- Payout amount


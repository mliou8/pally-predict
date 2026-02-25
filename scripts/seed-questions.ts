import 'dotenv/config';
import { db } from '../server/db';
import { questions } from '../shared/schema';

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

const talkShowQuestions = [
  {
    type: 'prediction' as const,
    prompt: "Bitcoin crashed from $122K to $68K. Where does it go next?",
    optionA: "Recovery mode - back above $90K by April",
    optionB: "Crypto winter continues - drops below $50K",
    optionC: "Sideways action - stays between $60K-$80K",
    optionD: "Moon mission - new ATH above $130K",
    context: "BTC retraced hard after hitting ATH. Whale accumulation is up, but macro headwinds persist. Tom Lee predicts strong Q3/Q4.",
    dropsAt: now,
    revealsAt: nextWeek,
  },
  {
    type: 'consensus' as const,
    prompt: "The Beckham family is imploding. Who's side are you on?",
    optionA: "Team David & Victoria - Brooklyn is being ungrateful",
    optionB: "Team Brooklyn & Nicola - the parents are controlling",
    optionC: "Both sides are messy - classic rich family drama",
    optionD: "This is staged PR for a reality show",
    context: "Brooklyn publicly called out his parents. Insiders say Nicola Peltz is at the center of the fallout.",
    dropsAt: now,
    revealsAt: tomorrow,
  },
  {
    type: 'prediction' as const,
    prompt: "Taylor Swift & Travis Kelce wedding - when's it happening?",
    optionA: "Summer 2026 - right after NFL season",
    optionB: "Fall 2026 - intimate autumn ceremony",
    optionC: "2027 or later - they're taking their time",
    optionD: "Never - they'll break up before the altar",
    context: "The couple continues making headlines as wedding speculation intensifies.",
    dropsAt: now,
    revealsAt: nextWeek,
  },
  {
    type: 'prediction' as const,
    prompt: "US military planning potential strikes on Iran. What happens?",
    optionA: "Limited strikes happen within 60 days",
    optionB: "Diplomatic solution prevents military action",
    optionC: "Tensions escalate but no direct US strikes",
    optionD: "Full military campaign lasting weeks",
    context: "Reuters reports US military planning for possible multi-week strikes if Trump orders. Tensions at critical level.",
    dropsAt: now,
    revealsAt: nextWeek,
  },
  {
    type: 'preference' as const,
    prompt: "ETH is down 24% this month. What's your move?",
    optionA: "Buying the dip - ETH to $5K eventually",
    optionB: "Selling and rotating to BTC",
    optionC: "Holding steady - not touching anything",
    optionD: "Moving to altcoins for higher upside",
    context: "Ethereum at ~$2,354 after rebounding from oversold conditions. Layer-2 adoption and AI-crypto narratives remain bullish drivers.",
    dropsAt: now,
    revealsAt: tomorrow,
  },
  {
    type: 'consensus' as const,
    prompt: "Lindsey Vonn competed at 41 in the 2026 Winter Olympics. Your take?",
    optionA: "Inspiring - proving age is just a number",
    optionB: "Selfish - taking a spot from younger athletes",
    optionC: "Respect the hustle, but it was her last ride",
    optionD: "Don't care - let athletes compete if they qualify",
    context: "Vonn faced criticism for competing at her age. She responded that critics 'don't understand' the dedication required.",
    dropsAt: now,
    revealsAt: tomorrow,
  },
];

async function seed() {
  console.log('Seeding questions...');

  for (const q of talkShowQuestions) {
    const result = await db.insert(questions).values(q).returning();
    console.log(`Created: "${q.prompt.substring(0, 50)}..."`);
  }

  console.log(`\nSuccessfully seeded ${talkShowQuestions.length} questions!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import 'dotenv/config';
import { db } from '../server/db';
import { questions, votes, questionResults } from '../shared/schema';

async function main() {
  // Delete in order: votes -> questionResults -> questions (due to foreign keys)
  await db.delete(votes);
  console.log('Deleted all votes');
  await db.delete(questionResults);
  console.log('Deleted all question results');
  await db.delete(questions);
  console.log('Deleted all questions');

  // Calculate dates - questions drop at 9am PT, reveal at 9pm PT
  const now = new Date();
  const dates = [];
  for (let i = 1; i <= 5; i++) {
    const dropsAt = new Date(now);
    dropsAt.setDate(dropsAt.getDate() + i);
    dropsAt.setHours(9, 0, 0, 0);

    const revealsAt = new Date(dropsAt);
    revealsAt.setHours(21, 0, 0, 0);

    dates.push({ dropsAt, revealsAt });
  }

  const newQuestions = [
    {
      type: 'prediction' as const,
      prompt: 'By the end of 2026, what will be the biggest impact of AI on white-collar jobs?',
      optionA: 'Universal 4-day work week',
      optionB: 'Massive 30%+ layoffs',
      optionC: 'Human-only work becomes luxury',
      optionD: 'Government bans autonomous AI',
      dropsAt: dates[0].dropsAt,
      revealsAt: dates[0].revealsAt,
    },
    {
      type: 'prediction' as const,
      prompt: 'By 2027, how will most people watch their favorite movies and TV shows?',
      optionA: 'Giant Super-App bundles',
      optionB: 'Mandatory commercials for everyone',
      optionC: 'AI-generated personalized shows',
      optionD: 'Resurgence of illegal piracy',
      dropsAt: dates[1].dropsAt,
      revealsAt: dates[1].revealsAt,
    },
    {
      type: 'consensus' as const,
      prompt: 'What will be the coolest way to use social media in 2026?',
      optionA: 'Private, invite-only group chats',
      optionB: 'Raw, unedited ugly content',
      optionC: 'Following realistic AI influencers',
      optionD: 'Quitting all digital platforms',
      dropsAt: dates[2].dropsAt,
      revealsAt: dates[2].revealsAt,
    },
    {
      type: 'prediction' as const,
      prompt: 'What will be the most controversial must-have health trend of 2026?',
      optionA: 'Cheap, universal weight-loss jabs',
      optionB: 'Lab-grown meat only diets',
      optionC: 'Brain-boosting focus implants',
      optionD: 'Mandatory phone-free sleep locks',
      dropsAt: dates[3].dropsAt,
      revealsAt: dates[3].revealsAt,
    },
    {
      type: 'prediction' as const,
      prompt: 'How will the majority of Gen Alpha find their first serious partners?',
      optionA: 'AI agents talk first',
      optionB: 'Meeting at offline clubs',
      optionC: 'Virtual Reality Metaverse dates',
      optionD: 'Matching by DNA compatibility',
      dropsAt: dates[4].dropsAt,
      revealsAt: dates[4].revealsAt,
    },
  ];

  for (const q of newQuestions) {
    await db.insert(questions).values(q);
    console.log('Added:', q.prompt.substring(0, 50) + '...');
  }

  console.log('\nDone! Added 5 questions scheduled over next 5 days.');
  process.exit(0);
}

main().catch(console.error);

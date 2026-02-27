import 'dotenv/config';
import { db } from '../server/db';
import { questions } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // Get first question and make it active now
  const [first] = await db.select().from(questions).limit(1);

  if (!first) {
    console.log('No questions found');
    process.exit(1);
  }

  const now = new Date();
  const revealsAt = new Date(now);
  revealsAt.setHours(revealsAt.getHours() + 12); // Reveal in 12 hours

  await db.update(questions)
    .set({
      dropsAt: now,
      revealsAt: revealsAt,
      isActive: true
    })
    .where(eq(questions.id, first.id));

  console.log('Activated question:', first.prompt.substring(0, 50) + '...');
  console.log('Reveals at:', revealsAt);
  process.exit(0);
}

main().catch(console.error);

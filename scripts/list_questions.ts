import 'dotenv/config';
import { db } from '../server/db';
import { questions } from '../shared/schema';

async function main() {
  const qs = await db.select().from(questions);
  console.log('\nQuestions in database:\n');
  for (const q of qs) {
    console.log(`- ${q.prompt.substring(0, 60)}...`);
    console.log(`  Drops: ${q.dropsAt}`);
    console.log(`  Reveals: ${q.revealsAt}\n`);
  }
  process.exit(0);
}

main().catch(console.error);

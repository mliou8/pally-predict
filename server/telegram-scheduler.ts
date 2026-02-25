import { telegramStorage } from './telegram-storage';
import { broadcastQuestion, broadcastResults } from './telegram-bot';
import type { VoteChoice } from '@shared/schema';

// Check interval in milliseconds
const CHECK_INTERVAL = 60 * 1000; // 1 minute

let schedulerInterval: NodeJS.Timeout | null = null;

// Process scheduled tasks
async function processTasks(): Promise<void> {
  try {
    // 1. Check for questions that need to be activated and sent
    const questionsToBroadcast = await telegramStorage.getQuestionsDueToSend();
    
    for (const question of questionsToBroadcast) {
      console.log(`[Scheduler] Activating and broadcasting question: ${question.id}`);
      
      // Activate the question
      await telegramStorage.activateQuestion(question.id);
      
      // Broadcast to all users
      const sentCount = await broadcastQuestion(question);
      console.log(`[Scheduler] Sent question to ${sentCount} users`);
    }

    // 2. Check for questions that need results processed and sent
    const questionsToReveal = await telegramStorage.getQuestionsToReveal();

    for (const question of questionsToReveal) {
      // Skip if no correct answer set (admin needs to set it first)
      if (!question.correctAnswer) {
        console.log(`[Scheduler] Question ${question.id} expired but no correct answer set - skipping`);
        continue;
      }

      console.log(`[Scheduler] Processing results for question: ${question.id}`);

      // Process results and update user balances
      await telegramStorage.processQuestionResults(question.id, question.correctAnswer as VoteChoice);
    }

    // 3. Send results for questions that have been processed but not sent
    const unsentResults = await telegramStorage.getUnsentResults();
    
    for (const question of unsentResults) {
      console.log(`[Scheduler] Sending results for question: ${question.id}`);
      
      // Broadcast results to participants
      const sentCount = await broadcastResults(question);
      console.log(`[Scheduler] Sent results to ${sentCount} users`);
      
      // Mark as sent
      await telegramStorage.markResultsSent(question.id);
    }
  } catch (error) {
    console.error('[Scheduler] Error processing tasks:', error);
  }
}

// Start the scheduler
export function startScheduler(): void {
  if (schedulerInterval) {
    console.log('[Scheduler] Already running');
    return;
  }
  
  console.log('[Scheduler] Starting with interval:', CHECK_INTERVAL / 1000, 'seconds');
  
  // Run immediately
  processTasks();
  
  // Then run on interval
  schedulerInterval = setInterval(processTasks, CHECK_INTERVAL);
}

// Stop the scheduler
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped');
  }
}

// Force process tasks (for admin use)
export async function forceProcessTasks(): Promise<{
  questionsActivated: number;
  questionsRevealed: number;
  resultsSent: number;
}> {
  const results = {
    questionsActivated: 0,
    questionsRevealed: 0,
    resultsSent: 0,
  };
  
  try {
    // 1. Activate questions
    const questionsToBroadcast = await telegramStorage.getQuestionsDueToSend();
    for (const question of questionsToBroadcast) {
      await telegramStorage.activateQuestion(question.id);
      await broadcastQuestion(question);
      results.questionsActivated++;
    }

    // 2. Reveal questions with correct answers
    const questionsToReveal = await telegramStorage.getQuestionsToReveal();
    for (const question of questionsToReveal) {
      if (question.correctAnswer) {
        await telegramStorage.processQuestionResults(question.id, question.correctAnswer as VoteChoice);
        results.questionsRevealed++;
      }
    }

    // 3. Send unsent results
    const unsentResults = await telegramStorage.getUnsentResults();
    for (const question of unsentResults) {
      await broadcastResults(question);
      await telegramStorage.markResultsSent(question.id);
      results.resultsSent++;
    }
  } catch (error) {
    console.error('[Scheduler] Error in force process:', error);
    throw error;
  }
  
  return results;
}


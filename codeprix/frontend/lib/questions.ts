import { supabase } from './supabase';

const POOL_KEY = 'cp_question_pool';
const SESSION_KEY = 'cp_questions';

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: string; // Changed to string for UUID
  body: string;
  options: QuestionOption[];
  correctLabel: string;
  sector: string;
  mappedCorrect?: number;
}

export interface SectorQuestions {
  [sector: string]: Question[];
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get questions from localStorage or fetch from Supabase
async function fetchQuestionsFromSupabase(): Promise<Question[]> {
  const stored = localStorage.getItem(POOL_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // If parsing fails, fetch fresh
    }
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('sector', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  // Transform data to match Question interface
  const questions: Question[] = data.map((q) => ({
    id: q.id,
    body: q.body || '',
    options: [
      { label: 'A', text: q.option_a },
      { label: 'B', text: q.option_b },
      { label: 'C', text: q.option_c },
      { label: 'D', text: q.option_d },
    ],
    correctLabel: q.correct_option || 'A',
    sector: q.sector?.toString() || '1',
  }));

  // Store in pool
  localStorage.setItem(POOL_KEY, JSON.stringify(questions));

  return questions;
}

// Get questions for an attempt with shuffling
export async function getQuestionsForAttempt(questionsPerSector: number): Promise<SectorQuestions> {
  const allQuestions = await fetchQuestionsFromSupabase();

  // Group by sector
  const bySector: SectorQuestions = {};
  for (const question of allQuestions) {
    const sector = question.sector || 'General';
    if (!bySector[sector]) {
      bySector[sector] = [];
    }
    bySector[sector].push(question);
  }

  // For each sector, pick random questions and shuffle options
  const result: SectorQuestions = {};
  for (const [sector, questions] of Object.entries(bySector)) {
    let selectedQuestions: Question[];

    if (questions.length > questionsPerSector) {
      // Pick random questions
      const shuffled = shuffleArray(questions);
      selectedQuestions = shuffled.slice(0, questionsPerSector);
    } else {
      // Use all questions
      selectedQuestions = [...questions];
    }

    // Shuffle options for each question
    result[sector] = selectedQuestions.map((q) => {
      const shuffledOptions = shuffleArray(q.options);
      const correctOptionIndex = q.options.findIndex((opt) => opt.label === q.correctLabel);
      const mappedCorrect = correctOptionIndex >= 0 ? shuffledOptions.findIndex((opt) => opt.label === q.correctLabel) : 0;

      return {
        ...q,
        options: shuffledOptions,
        mappedCorrect,
      };
    });
  }

  return result;
}

// Flatten sector questions into a single array
export function flattenQuestions(sectoredQuestions: SectorQuestions): Question[] {
  const flat: Question[] = [];

  // Order: sector1, sector2, sector3
  const sectorOrder = Object.keys(sectoredQuestions);
  for (const sector of sectorOrder) {
    flat.push(...sectoredQuestions[sector]);
  }

  return flat;
}

// Save questions to localStorage
export function saveQuestionsToStorage(questions: Question[]): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(questions));
}

// Get questions from localStorage
export function getQuestionsFromStorage(): Question[] | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Clear questions from storage
export function clearQuestionsStorage(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(POOL_KEY); // Also clear pool to get fresh Suppabase data
}

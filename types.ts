
export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE'
}

export enum Quadrant {
  Q1 = 'Q1', // Quan trọng & Khẩn cấp (Làm ngay)
  Q2 = 'Q2', // Quan trọng & Không khẩn cấp (Lên kế hoạch)
  Q3 = 'Q3', // Không quan trọng & Khẩn cấp (Giao việc)
  Q4 = 'Q4'  // Không quan trọng & Không khẩn cấp (Xóa bỏ)
}

export enum PickleSize {
  ROCK = 'ROCK',   // Đá tảng
  PEBBLE = 'PEBBLE', // Sỏi
  SAND = 'SAND'    // Cát
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  quadrant: Quadrant;
  pickleSize: PickleSize;
  dueDate?: string;
  description?: string;
  note?: string; // Additional notes
  completedAt?: number; // Timestamp
  durationMinutes?: number; // Estimated deep work time
  yearlyGoalId?: string; // Link to a yearly goal
  moscow?: 'MUST' | 'SHOULD' | 'COULD' | 'WONT';
  assignDate?: string; // YYYY-MM-DD key for daily planner segregation
  assignWeek?: string; // YYYY-W## key for weekly Eisenhower segregation
}

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  startDate?: string;
  deadline?: string;
}

export interface YearlyGoal {
  id: string;
  title: string;
  isTop5: boolean;
  progress: number; // 0-100
  deadline?: string;
  milestones?: Milestone[];
}

export interface ScheduleBlock {
  time: string; // "05:00", "06:00"
  taskLeft?: string;
  taskRight?: string;
}

export interface DailyFinance {
  income: number;
  expense: number;
}

export interface DailyHabit {
  id: string;
  name: string;
  completed: boolean;
}

export interface DailyLog {
  date: string;
  gratitude: string;
  successJournal: string;
  lessonLearned: string;
  mood: 'great' | 'good' | 'neutral' | 'bad' | null;
  moodNote: string;
  finance: DailyFinance;
  futureNote: string;
  schedule: ScheduleBlock[];
  bigGoal?: string;
  bigGoalCompleted?: boolean;
  bigGoalTime?: string;
  bigGoalYearlyGoalId?: string;
  habits?: DailyHabit[];
}

// --- LEARNING & SRS TYPES ---

export const SRS_INTERVALS = [1, 3, 7, 14, 30]; // Days

export interface Flashcard {
    id: string;
    question: string; // Front
    answer: string;   // Back
    stage: number;    // 0 to 5 (Mastered)
    nextReviewDate: string; // YYYY-MM-DD
    lastReviewed?: string;
}

export interface KnowledgeNote {
    id: string;
    title: string;
    content: string; // Main concept / Theory
    category: string;
    createdAt: string;
    flashcards: Flashcard[];
}
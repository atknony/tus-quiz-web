export const API = import.meta.env.VITE_API_BASE as string;

export type Subject = { id: number; name: string };
export type Choice = { id: number; text: string; is_correct: boolean; question: number };
export type Question = {
  id: number;
  subject: number;
  subject_name: string;
  text: string;
  explanation: string;
  difficulty: number;
  choices: Choice[];
};

type DRFList<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export const urls = {
  subjects: () => `${API}/subjects/`,
  randomQuestions: (n: number, subject?: number, difficulty?: number) => {
    const sp = new URLSearchParams({ n: String(n) });
    if (subject) sp.set("subject", String(subject));
    if (difficulty) sp.set("difficulty", String(difficulty));
    return `${API}/questions/random/?${sp.toString()}`;
  }
};

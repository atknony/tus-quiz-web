import { useQuery } from "@tanstack/react-query";
import { urls, Subject, Question } from "@/lib/api";

export function useSubjects() {
  return useQuery<Subject[]>({
    queryKey: [urls.subjects()],
  });
}

export function useRandomQuestions(n: number, subject?: number, difficulty?: number) {
  return useQuery<{ results: Question[]; count: number }>({
    queryKey: [urls.randomQuestions(n, subject, difficulty)],
  });
}

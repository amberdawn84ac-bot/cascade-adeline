import type { LessonBlock } from '@/lib/langgraph/lesson/lessonState';

declare global {
  interface Window {
    __addLessonBlock?: (block: LessonBlock) => void;
    __setLessonMetadata?: (metadata: Record<string, unknown> & { lessonId?: string }) => void;
  }
}

export {};

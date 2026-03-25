declare global {
  interface Window {
    __addLessonBlock?: (block: any) => void;
    __setLessonMetadata?: (metadata: any) => void;
  }
}

export {};

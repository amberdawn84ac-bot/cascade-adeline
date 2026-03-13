export type OnboardingData = {
  childName?: string;
  gradeLevel?: string;
  interests?: string[];
  cognitiveProfile?: string;
  learningStyle?: string;
  coppaConsent?: boolean;
  state?: string;
  graduationYear?: number;
};

export type OnboardingStep = {
  title: string;
  content?: string;
  fields?: Array<{
    name: keyof OnboardingData;
    label: string;
    type: 'text' | 'grade-selector' | 'tag-input' | 'learning-style' | 'checkbox' | 'state-selector' | 'graduation-year';
  }>;
  illustration?: React.ReactNode;
};


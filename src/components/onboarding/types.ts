export type OnboardingData = {
  childName?: string;
  gradeLevel?: string;
  interests?: string[];
};

export type OnboardingStep = {
  title: string;
  content?: string;
  fields?: Array<{
    name: keyof OnboardingData;
    label: string;
    type: 'text' | 'grade-selector' | 'tag-input';
  }>;
  illustration?: React.ReactNode;
};

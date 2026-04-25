import { z } from 'zod';

export interface UIPattern {
  id: string;
  name: string;
  component: string;
  description: string;
  tags: string[];
  propsSchema: z.ZodSchema;
  example: Record<string, unknown>;
}

export const UI_PATTERNS: UIPattern[] = [
  // Existing components from the codebase
  {
    id: 'transcript-card',
    name: 'Transcript Credit Card',
    component: 'TranscriptCard',
    description: 'Display earned credits with subject badges and extension suggestions',
    tags: ['credits', 'transcript', 'achievement', 'progress'],
    propsSchema: z.object({
      activityName: z.string(),
      mappedSubjects: z.array(z.string()),
      creditsEarned: z.union([z.number(), z.string()]),
      extensionSuggestion: z.string().optional(),
    }),
    example: {
      activityName: 'Water Quality Testing Project',
      mappedSubjects: ['Science', 'Environmental Studies'],
      creditsEarned: 0.5,
      extensionSuggestion: 'Expand to test 5 more water sources',
    },
  },
  {
    id: 'investigation-board',
    name: 'Investigation Board',
    component: 'InvestigationBoard',
    description: 'Display research sources with type classification (primary, curated, secondary)',
    tags: ['research', 'investigation', 'sources', 'critical-thinking'],
    propsSchema: z.object({
      topic: z.string(),
      sources: z.array(z.object({
        title: z.string(),
        snippet: z.string(),
        type: z.enum(['PRIMARY', 'CURATED', 'SECONDARY', 'MAINSTREAM']),
      })),
    }),
    example: {
      topic: 'Mass Incarceration in America',
      sources: [
        { title: 'Bureau of Justice Statistics', snippet: 'Official incarceration rates 1980-2020', type: 'PRIMARY' },
        { title: 'The New Jim Crow', snippet: 'Analysis of systemic racial bias', type: 'CURATED' },
      ],
    },
  },
  {
    id: 'project-impact-card',
    name: 'Project Impact Card',
    component: 'ProjectImpactCard',
    description: 'Track project progress through stages with service goal and beneficiaries',
    tags: ['project', 'service', 'impact', 'progress'],
    propsSchema: z.object({
      title: z.string(),
      serviceGoal: z.string(),
      beneficiaries: z.string(),
      stage: z.enum(['BRAINSTORM', 'ACTIVE', 'COMPLETED', 'SHOWCASED']),
    }),
    example: {
      title: 'Community Garden Initiative',
      serviceGoal: 'Provide fresh produce to 20 families',
      beneficiaries: 'Low-income families in the neighborhood',
      stage: 'ACTIVE',
    },
  },
  {
    id: 'mission-briefing',
    name: 'Mission Briefing',
    component: 'MissionBriefing',
    description: 'Step-by-step mission with objective and optional risk note',
    tags: ['mission', 'quest', 'steps', 'challenge'],
    propsSchema: z.object({
      title: z.string(),
      objective: z.string(),
      steps: z.array(z.string()),
      riskNote: z.string().optional(),
    }),
    example: {
      title: 'Water Testing Mission',
      objective: 'Test 3 local water sources for contaminants',
      steps: ['Collect samples from creek, pond, and tap', 'Run pH and turbidity tests', 'Document findings with photos'],
      riskNote: 'Wear gloves when handling creek water',
    },
  },
  {
    id: 'timeline-existing',
    name: 'Timeline Viewer (Existing)',
    component: 'Timeline',
    description: 'Display historical events in chronological order',
    tags: ['history', 'timeline', 'events', 'chronology'],
    propsSchema: z.object({
      title: z.string().optional(),
      events: z.array(z.object({
        year: z.string().optional(),
        date: z.string().optional(),
        title: z.string().optional(),
        event: z.string().optional(),
        description: z.string().optional(),
        details: z.string().optional(),
      })),
    }),
    example: {
      title: 'Civil Rights Movement',
      events: [
        { year: '1954', title: 'Brown v. Board', description: 'Supreme Court rules segregation unconstitutional' },
        { year: '1963', title: 'March on Washington', description: 'MLK delivers "I Have a Dream" speech' },
      ],
    },
  },
  {
    id: 'hebrew-study-card',
    name: 'Hebrew Study Card',
    component: 'HebrewStudyCard',
    description: 'Display biblical text analysis with original Hebrew/Greek and cultural context',
    tags: ['bible', 'hebrew', 'greek', 'scripture', 'study'],
    propsSchema: z.object({
      passage: z.string(),
      reference: z.string(),
      originalText: z.string().optional(),
      literalTranslation: z.string(),
      culturalContext: z.string(),
      deeperMeaning: z.string(),
    }),
    example: {
      passage: 'In the beginning God created the heavens and the earth',
      reference: 'Genesis 1:1',
      originalText: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים',
      literalTranslation: 'In-beginning created Elohim',
      culturalContext: 'Ancient Hebrew cosmology viewed creation as ordering chaos',
      deeperMeaning: 'The verb "bara" is used exclusively for divine creation',
    },
  },
  // New pattern library components
  {
    id: 'quiz-card',
    name: 'Multiple Choice Quiz',
    component: 'QuizCard',
    description: 'Interactive multiple choice question with instant feedback',
    tags: ['quiz', 'assessment', 'interactive', 'education'],
    propsSchema: z.object({
      question: z.string(),
      options: z.array(z.string()).min(2).max(6),
      correctIndex: z.number().min(0),
      explanation: z.string().optional(),
    }),
    example: {
      question: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctIndex: 1,
      explanation: 'Paris has been the capital of France since 987 AD.',
    },
  },
  {
    id: 'bar-chart',
    name: 'Data Bar Chart',
    component: 'BarChartCard',
    description: 'Visual bar chart for comparing numerical data across categories',
    tags: ['data', 'visualization', 'chart', 'comparison'],
    propsSchema: z.object({
      title: z.string(),
      data: z.array(z.object({
        label: z.string(),
        value: z.number(),
      })),
      xAxisLabel: z.string().optional(),
      yAxisLabel: z.string().optional(),
    }),
    example: {
      title: 'Student Test Scores',
      data: [
        { label: 'Math', value: 85 },
        { label: 'Science', value: 92 },
        { label: 'History', value: 78 },
      ],
      yAxisLabel: 'Score (%)',
    },
  },
  {
    id: 'flashcard',
    name: 'Concept Flashcard',
    component: 'Flashcard',
    description: 'Flip card showing term on front and definition on back',
    tags: ['review', 'vocabulary', 'memory', 'study'],
    propsSchema: z.object({
      term: z.string(),
      definition: z.string(),
      example: z.string().optional(),
      category: z.string().optional(),
    }),
    example: {
      term: 'Photosynthesis',
      definition: 'The process by which plants convert light energy into chemical energy',
      example: 'Plants use photosynthesis to create glucose from sunlight, water, and CO2',
      category: 'Biology',
    },
  },
  {
    id: 'timeline',
    name: 'Timeline Viewer',
    component: 'TimelineCard',
    description: 'Chronological sequence of events with dates and descriptions',
    tags: ['history', 'sequence', 'chronology', 'events'],
    propsSchema: z.object({
      title: z.string(),
      events: z.array(z.object({
        date: z.string(),
        title: z.string(),
        description: z.string(),
      })),
    }),
    example: {
      title: 'American Revolution Timeline',
      events: [
        { date: '1773', title: 'Boston Tea Party', description: 'Colonists protested British taxation' },
        { date: '1775', title: 'Lexington & Concord', description: 'First battles of the war' },
        { date: '1776', title: 'Declaration of Independence', description: 'Colonies declared independence' },
      ],
    },
  },
  {
    id: 'step-list',
    name: 'Step-by-Step Procedure',
    component: 'StepList',
    description: 'Ordered list of instructions or procedural steps',
    tags: ['science', 'instructions', 'procedure', 'how-to'],
    propsSchema: z.object({
      title: z.string(),
      steps: z.array(z.object({
        number: z.number(),
        instruction: z.string(),
        tip: z.string().optional(),
      })),
    }),
    example: {
      title: 'How to Conduct a Volcano Experiment',
      steps: [
        { number: 1, instruction: 'Place bottle in tray', tip: 'Use a large tray to catch overflow' },
        { number: 2, instruction: 'Add baking soda to bottle' },
        { number: 3, instruction: 'Pour vinegar and watch eruption!' },
      ],
    },
  },
  {
    id: 'compare-table',
    name: 'Comparison Table',
    component: 'CompareTable',
    description: 'Side-by-side comparison of concepts, ideas, or data',
    tags: ['analysis', 'reasoning', 'comparison', 'critical-thinking'],
    propsSchema: z.object({
      title: z.string(),
      columns: z.array(z.string()).min(2),
      rows: z.array(z.object({
        label: z.string(),
        values: z.array(z.string()),
      })),
    }),
    example: {
      title: 'Plant vs Animal Cells',
      columns: ['Feature', 'Plant Cell', 'Animal Cell'],
      rows: [
        { label: 'Cell Wall', values: ['Feature', 'Yes', 'No'] },
        { label: 'Chloroplasts', values: ['Chloroplasts', 'Yes', 'No'] },
        { label: 'Shape', values: ['Shape', 'Rectangular', 'Round'] },
      ],
    },
  },
  {
    id: 'math-display',
    name: 'Math Equation Display',
    component: 'MathDisplay',
    description: 'Formatted mathematical equation with step-by-step solution',
    tags: ['math', 'formula', 'equation', 'algebra'],
    propsSchema: z.object({
      problem: z.string(),
      steps: z.array(z.object({
        equation: z.string(),
        explanation: z.string(),
      })),
      finalAnswer: z.string(),
    }),
    example: {
      problem: 'Solve for x: 2x + 5 = 13',
      steps: [
        { equation: '2x + 5 = 13', explanation: 'Original equation' },
        { equation: '2x = 8', explanation: 'Subtract 5 from both sides' },
        { equation: 'x = 4', explanation: 'Divide both sides by 2' },
      ],
      finalAnswer: 'x = 4',
    },
  },
  {
    id: 'progress-ring',
    name: 'Progress Ring',
    component: 'ProgressRing',
    description: 'Circular progress indicator showing completion percentage',
    tags: ['feedback', 'credits', 'progress', 'mastery'],
    propsSchema: z.object({
      label: z.string(),
      current: z.number(),
      total: z.number(),
      unit: z.string().optional(),
    }),
    example: {
      label: 'Math Mastery',
      current: 15,
      total: 20,
      unit: 'standards',
    },
  },
  // Visual artifact patterns
  {
    id: 'infographic-poster',
    name: 'Infographic Poster',
    component: 'InfographicPosterCard',
    description: 'Visual poster with structured sections, bold headers, and minimal text — designed for one-glance learning',
    tags: ['visual', 'infographic', 'poster', 'design', 'overview', 'summary'],
    propsSchema: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      sections: z.array(z.object({
        header: z.string(),
        content: z.array(z.string()),
        icon: z.string().optional(),
        visual: z.string().optional(),
      })).min(2).max(8),
      colorPalette: z.array(z.string()).optional(),
      layout: z.enum(['vertical', 'grid']),
      callToAction: z.string().optional(),
    }),
    example: {
      title: 'The Water Cycle',
      subtitle: 'How water moves through our world',
      sections: [
        { header: 'Evaporation', content: ['Sun heats surface water', 'Water becomes vapor'], icon: '☀️', visual: 'arrow rising from water' },
        { header: 'Condensation', content: ['Vapor cools in atmosphere', 'Forms clouds and fog'], icon: '☁️' },
        { header: 'Precipitation', content: ['Water falls as rain or snow', 'Returns to earth'], icon: '🌧️' },
      ],
      layout: 'vertical',
      callToAction: 'Collect rainwater today and measure it!',
    },
  },
  {
    id: 'animal-infographic',
    name: 'Animal Infographic',
    component: 'AnimalInfographicCard',
    description: 'Visual animal profile with stats, habitat, adaptations, and fun facts — styled for education',
    tags: ['animal', 'nature', 'biology', 'wildlife', 'science', 'creature'],
    propsSchema: z.object({
      animal: z.string(),
      heroFact: z.string(),
      stats: z.record(z.string()),
      sections: z.array(z.object({
        header: z.string(),
        content: z.array(z.string()),
        icon: z.string().optional(),
        visual: z.string().optional(),
      })).min(2).max(6),
      funFacts: z.array(z.string()).optional(),
      illustrationStyle: z.string().optional(),
    }),
    example: {
      animal: 'Red Fox',
      heroFact: 'Fast, adaptable predator found on every continent except Antarctica',
      stats: { Speed: '30 mph', Diet: 'omnivore', Lifespan: '3–5 years', Weight: '8–15 lbs' },
      sections: [
        { header: 'Habitat', content: ['Forests and woodlands', 'Grasslands and farmland', 'Suburban areas'], visual: 'map silhouette' },
        { header: 'Adaptations', content: ['Sharp hearing detects prey underground', 'Night vision for hunting at dusk'], visual: 'labeled body diagram' },
      ],
      funFacts: ['Uses Earth\'s magnetic field to hunt', 'Can make 40 different sounds'],
    },
  },
  {
    id: 'illustrated-recipe',
    name: 'Illustrated Recipe',
    component: 'IllustratedRecipeCard',
    description: 'Step-by-step recipe card with ingredients, illustrated steps, and tips — farmhouse style',
    tags: ['recipe', 'cooking', 'life-skills', 'food', 'baking', 'how-to', 'steps'],
    propsSchema: z.object({
      title: z.string(),
      steps: z.array(z.object({
        step: z.number(),
        title: z.string(),
        instruction: z.string(),
        visual: z.string().optional(),
        tip: z.string().optional(),
      })).min(3).max(12),
      ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
        icon: z.string().optional(),
      })).min(1).max(20),
      layout: z.string().optional(),
      style: z.string().optional(),
    }),
    example: {
      title: 'Sourdough Bread',
      ingredients: [
        { name: 'Bread flour', amount: '3 cups', icon: '🌾' },
        { name: 'Sourdough starter', amount: '½ cup', icon: '🫙' },
        { name: 'Salt', amount: '1½ tsp', icon: '🧂' },
        { name: 'Water', amount: '1¼ cups', icon: '💧' },
      ],
      steps: [
        { step: 1, title: 'Mix', instruction: 'Combine flour, water, and starter until shaggy', visual: 'bowl with mixing arrows', tip: 'Use filtered water for best results' },
        { step: 2, title: 'Autolyse', instruction: 'Cover and rest 30 minutes', visual: 'covered bowl with timer' },
        { step: 3, title: 'Add salt', instruction: 'Add salt and fold into dough' },
        { step: 4, title: 'Bulk ferment', instruction: 'Fold every 30 minutes for 4 hours', tip: 'Dough should be jiggly and doubled' },
        { step: 5, title: 'Shape & Bake', instruction: 'Shape loaf, refrigerate overnight, bake at 500°F in Dutch oven' },
      ],
      style: 'hand-drawn farmhouse',
    },
  },
  {
    id: 'visual-deep-dive',
    name: 'Visual Deep Dive',
    component: 'VisualDeepDiveCard',
    description: 'Hybrid infographic-lesson — looks like a poster, teaches like a full lesson. Each section has a visual summary, deep explanation, real-world connection, and optional activity.',
    tags: ['lesson', 'deep', 'explain', 'teach', 'visual', 'learn', 'study', 'explore'],
    propsSchema: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      sections: z.array(z.object({
        header: z.string(),
        visual_summary: z.array(z.string()),
        deep_explanation: z.string(),
        why_it_matters: z.string(),
        visual: z.string().optional(),
        activity: z.string().optional(),
      })).min(3).max(7),
    }),
    example: {
      title: 'How Photosynthesis Works',
      subtitle: 'Plants turning light into food — and why it feeds the whole earth',
      sections: [
        {
          header: 'Capturing Light',
          visual_summary: ['Leaves absorb sunlight', 'Chlorophyll = the green molecule that does it'],
          deep_explanation: 'Chlorophyll molecules inside leaf cells absorb red and blue light from the sun, reflecting green light back to our eyes. This absorbed energy powers the first stage of photosynthesis, splitting water molecules into hydrogen and oxygen.',
          why_it_matters: 'Every breath you take depends on this — the oxygen in the air is the "waste product" plants release while capturing light.',
          visual: 'cross-section of leaf cell showing chloroplasts absorbing light rays',
          activity: 'Hold a leaf up to bright sunlight. What colour does it transmit? Sketch what you see.',
        },
      ],
    },
  },
];

export function findPatternByTags(tags: string[]): UIPattern | null {
  const lowerTags = tags.map(t => t.toLowerCase());
  
  for (const pattern of UI_PATTERNS) {
    const matchCount = pattern.tags.filter(tag => 
      lowerTags.some(lt => tag.includes(lt) || lt.includes(tag))
    ).length;
    
    if (matchCount >= 2) {
      return pattern;
    }
  }
  
  for (const pattern of UI_PATTERNS) {
    const matchCount = pattern.tags.filter(tag => 
      lowerTags.some(lt => tag.includes(lt) || lt.includes(tag))
    ).length;
    
    if (matchCount >= 1) {
      return pattern;
    }
  }
  
  return null;
}

export function findPatternById(id: string): UIPattern | null {
  return UI_PATTERNS.find(p => p.id === id) || null;
}

export function findPatternByComponent(component: string): UIPattern | null {
  return UI_PATTERNS.find(p => p.component === component) || null;
}

export function getAllPatterns(): UIPattern[] {
  return UI_PATTERNS;
}

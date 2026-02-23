import prisma from './db';

export interface AdaptiveContent {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  gradeAppropriate: boolean;
  adaptations: {
    vocabulary: string[];
    concepts: string[];
    examples: string[];
    challenges: string[];
  };
}

export interface GradeLevelConfig {
  'k2': {
    mathConcepts: string[];
    scienceConcepts: string[];
    readingLevel: 'picture-books' | 'simple-text';
    attentionSpan: number; // minutes
    interactiveElements: 'drag-drop' | 'simple-clicks' | 'drawing';
  };
  '35': {
    mathConcepts: string[];
    scienceConcepts: string[];
    readingLevel: 'early-reader' | 'chapter-books';
    attentionSpan: number;
    interactiveElements: 'drag-drop' | 'typing' | 'drawing';
  };
  '68': {
    mathConcepts: string[];
    scienceConcepts: string[];
    readingLevel: 'independent-reader' | 'young-adult';
    attentionSpan: number;
    interactiveElements: 'typing' | 'coding' | 'complex-drawing';
  };
  '912': {
    mathConcepts: string[];
    scienceConcepts: string[];
    readingLevel: 'young-adult' | 'adult';
    attentionSpan: number;
    interactiveElements: 'coding' | 'research' | 'complex-problem-solving';
  };
}

const GRADE_CONFIGS: GradeLevelConfig = {
  'k2': {
    mathConcepts: ['counting', 'basic-addition', 'shapes', 'patterns', 'measurement'],
    scienceConcepts: ['plants', 'animals', 'weather', 'five-senses', 'seasons'],
    readingLevel: 'picture-books',
    attentionSpan: 15,
    interactiveElements: 'drag-drop'
  },
  '35': {
    mathConcepts: ['multiplication', 'division', 'fractions', 'geometry', 'data'],
    scienceConcepts: ['ecosystems', 'simple-machines', 'matter', 'energy', 'life-cycles'],
    readingLevel: 'early-reader',
    attentionSpan: 25,
    interactiveElements: 'typing'
  },
  '68': {
    mathConcepts: ['algebra', 'ratios', 'statistics', 'geometry-proofs', 'functions'],
    scienceConcepts: ['cells', 'chemistry', 'physics', 'genetics', 'astronomy'],
    readingLevel: 'independent-reader',
    attentionSpan: 35,
    interactiveElements: 'coding'
  },
  '912': {
    mathConcepts: ['advanced-algebra', 'calculus', 'statistics', 'trigonometry', 'economics'],
    scienceConcepts: ['biochemistry', 'quantum-physics', 'genetics', 'environmental-science', 'research-methods'],
    readingLevel: 'young-adult',
    attentionSpan: 45,
    interactiveElements: 'research'
  }
};

export function getGradeBand(gradeLevel: string): keyof GradeLevelConfig {
  if (!gradeLevel) return '35'; // default
  
  const grade = parseInt(gradeLevel);
  if (isNaN(grade)) return '35'; // handle invalid input
  
  if (grade <= 2) return 'k2';
  if (grade <= 5) return '35';
  if (grade <= 8) return '68';
  return '912';
}

export function getAdaptiveContent(
  contentType: 'math' | 'science' | 'reading' | 'history' | 'arcade',
  gradeLevel: string,
  topic: string
): AdaptiveContent {
  const gradeBand = getGradeBand(gradeLevel);
  const config = GRADE_CONFIGS[gradeBand];
  
  // Base content that gets adapted
  const baseContent = getBaseContent(contentType, topic);
  
  // Adapt based on grade level
  return {
    ...baseContent,
    adaptations: adaptContentForGrade(baseContent, gradeBand, config, contentType, topic),
    gradeAppropriate: true,
    difficulty: getDifficultyForGrade(gradeBand)
  };
}

function getBaseContent(contentType: string, topic: string): Omit<AdaptiveContent, 'adaptations' | 'gradeAppropriate' | 'difficulty'> {
  const contentMap: Record<string, Record<string, any>> = {
    math: {
      business: {
        title: "Business Math",
        description: "Learn math through running a virtual business",
        concepts: ['profit', 'revenue', 'costs', 'budgeting']
      },
      geometry: {
        title: "Geometry Workshop", 
        description: "Explore shapes, areas, and volumes",
        concepts: ['shapes', 'area', 'perimeter', 'volume']
      },
      data: {
        title: "Data Detective",
        description: "Analyze data and create charts",
        concepts: ['data', 'charts', 'patterns', 'analysis']
      }
    },
    science: {
      nature: {
        title: "Nature Journal",
        description: "Document observations of the natural world",
        concepts: ['observation', 'recording', 'patterns', 'ecosystems']
      },
      chemistry: {
        title: "Kitchen Chemistry",
        description: "Safe experiments with household items",
        concepts: ['reactions', 'solutions', 'safety', 'scientific-method']
      },
      biology: {
        title: "Life Science",
        description: "Explore living organisms and cells",
        concepts: ['cells', 'ecosystems', 'life-cycles', 'adaptation']
      }
    },
    arcade: {
      coding: {
        title: "Coding Lab",
        description: "Learn programming through interactive projects",
        concepts: ['programming', 'logic', 'problem-solving', 'creativity']
      },
      'game-design': {
        title: "Game Design Studio",
        description: "Design and create your own games",
        concepts: ['design', 'storytelling', 'mechanics', 'user-experience']
      },
      'logic-puzzles': {
        title: "Logic Circuits",
        description: "Solve puzzles and build logical thinking",
        concepts: ['logic', 'circuits', 'problem-solving', 'critical-thinking']
      }
    },
    history: {
      timeline: {
        title: "Interactive History Timeline",
        description: "Explore historical events with primary sources",
        concepts: ['history', 'primary-sources', 'critical-analysis', 'chronology']
      }
    }
  };
  
  return contentMap[contentType]?.[topic] || {
    title: "Learning Activity",
    description: "Explore and learn",
    concepts: []
  };
}

function adaptContentForGrade(
  baseContent: any,
  gradeBand: keyof GradeLevelConfig,
  config: GradeLevelConfig[keyof GradeLevelConfig],
  contentType: string,
  topic: string
): AdaptiveContent['adaptations'] {
  const adaptations = {
    vocabulary: [] as string[],
    concepts: [] as string[],
    examples: [] as string[],
    challenges: [] as string[]
  };
  
  // Adapt based on content type
  if (contentType === 'arcade') {
    return adaptArcadeContent(gradeBand, topic);
  } else if (contentType === 'history') {
    return adaptHistoryContent(gradeBand, topic);
  } else {
    return adaptAcademicContent(gradeBand, topic);
  }
}

function adaptArcadeContent(gradeBand: keyof GradeLevelConfig, topic: string): AdaptiveContent['adaptations'] {
  const adaptations = {
    vocabulary: [] as string[],
    concepts: [] as string[],
    examples: [] as string[],
    challenges: [] as string[]
  };
  
  if (gradeBand === 'k2') {
    adaptations.vocabulary = ['click', 'drag', 'play', 'fun', 'game'];
    adaptations.examples = ['Drag and drop shapes', 'Click to make sounds', 'Play memory games'];
    adaptations.challenges = ['Can you match the colors?', 'Build a simple puzzle', 'Create a pattern'];
  } else if (gradeBand === '35') {
    adaptations.vocabulary = ['code', 'script', 'debug', 'design', 'character'];
    adaptations.examples = ['Create simple animations', 'Design a game character', 'Write basic code'];
    adaptations.challenges = ['Build a simple game', 'Create a story game', 'Debug a simple program'];
  } else if (gradeBand === '68') {
    adaptations.vocabulary = ['algorithm', 'function', 'variable', 'framework', 'logic-gates'];
    adaptations.examples = ['Create interactive stories', 'Build puzzle games', 'Design game mechanics'];
    adaptations.challenges = ['Create a platformer game', 'Build logic circuits', 'Design game levels'];
  } else {
    adaptations.vocabulary = ['artificial-intelligence', 'machine-learning', 'physics-engine', 'networking', 'algorithms'];
    adaptations.examples = ['Create AI opponents', 'Build multiplayer games', 'Design complex systems'];
    adaptations.challenges = ['Create an AI game', 'Build a game engine', 'Design networked gameplay'];
  }
  
  return adaptations;
}

function adaptHistoryContent(gradeBand: keyof GradeLevelConfig, topic: string): AdaptiveContent['adaptations'] {
  const adaptations = {
    vocabulary: [] as string[],
    concepts: [] as string[],
    examples: [] as string[],
    challenges: [] as string[]
  };
  
  if (gradeBand === 'k2') {
    adaptations.vocabulary = ['past', 'old', 'story', 'family', 'time'];
    adaptations.examples = ['Family photo stories', 'Classroom timeline', 'Story of your town'];
    adaptations.challenges = ['Draw your family history', 'Tell a story about yesterday', 'Make a picture timeline'];
  } else if (gradeBand === '35') {
    adaptations.vocabulary = ['timeline', 'evidence', 'source', 'community', 'decade'];
    adaptations.examples = ['Local history research', 'Family interviews', 'Historical artifacts'];
    adaptations.challenges = ['Research your town history', 'Interview a grandparent', 'Create a family timeline'];
  } else if (gradeBand === '68') {
    adaptations.vocabulary = ['primary-source', 'bias', 'perspective', 'chronology', 'historical-analysis'];
    adaptations.examples = ['Analyze historical documents', 'Compare historical accounts', 'Research historical debates'];
    adaptations.challenges = ['Analyze conflicting sources', 'Research historical controversy', 'Create historical argument'];
  } else {
    adaptations.vocabulary = ['historiography', 'revisionism', 'propaganda', 'contextual-analysis', 'source-criticism'];
    adaptations.examples = ['Analyze historical narratives', 'Research historical interpretation', 'Study historical methodology'];
    adaptations.challenges = ['Challenge historical narratives', 'Research historical revisionism', 'Analyze historical bias'];
  }
  
  return adaptations;
}

function adaptAcademicContent(gradeBand: keyof GradeLevelConfig, topic: string): AdaptiveContent['adaptations'] {
  const adaptations = {
    vocabulary: [] as string[],
    concepts: [] as string[],
    examples: [] as string[],
    challenges: [] as string[]
  };
  
  // Adapt vocabulary based on reading level
  if (gradeBand === 'k2') {
    adaptations.vocabulary = ['count', 'add', 'money', 'help', 'share'];
    adaptations.examples = ['Share cookies with friends', 'Count your toys', 'Help mom cook'];
    adaptations.challenges = ['Can you count to 20?', 'Share toys equally', 'Help set the table'];
  } else if (gradeBand === '35') {
    adaptations.vocabulary = ['multiply', 'divide', 'measure', 'calculate', 'save'];
    adaptations.examples = ['Save allowance for toys', 'Calculate recipe ingredients', 'Measure room for furniture'];
    adaptations.challenges = ['Plan a lemonade stand', 'Budget for a video game', 'Calculate garden area'];
  } else if (gradeBand === '68') {
    adaptations.vocabulary = ['profit-margin', 'percentage', 'algebra', 'variables', 'equations'];
    adaptations.examples = ['Start an online business', 'Invest in stocks', 'Create a budget spreadsheet'];
    adaptations.challenges = ['Design a business plan', 'Analyze market trends', 'Create financial projections'];
  } else {
    adaptations.vocabulary = ['return-on-investment', 'compound-interest', 'calculus', 'economics', 'market-analysis'];
    adaptations.examples = ['Invest in real estate', 'Start a company', 'Analyze economic trends'];
    adaptations.challenges = ['Create investment portfolio', 'Develop business strategy', 'Conduct market research'];
  }
  
  return adaptations;
}

function getDifficultyForGrade(gradeBand: keyof GradeLevelConfig): 'beginner' | 'intermediate' | 'advanced' {
  switch (gradeBand) {
    case 'k2': return 'beginner';
    case '35': return 'beginner';
    case '68': return 'intermediate';
    case '912': return 'advanced';
    default: return 'intermediate';
  }
}

export async function getUserAdaptiveContent(userId: string, contentType: string, topic: string) {
  // Get user's grade level
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gradeLevel: true }
  });
  
  if (!user?.gradeLevel) {
    // Return default content if no grade level set
    return getAdaptiveContent(contentType as any, '3', topic);
  }
  
  return getAdaptiveContent(contentType as any, user.gradeLevel, topic);
}

export function getAttentionSpanForGrade(gradeLevel: string): number {
  const gradeBand = getGradeBand(gradeLevel);
  return GRADE_CONFIGS[gradeBand].attentionSpan;
}

export function getInteractiveTypeForGrade(gradeLevel: string): string {
  const gradeBand = getGradeBand(gradeLevel);
  return GRADE_CONFIGS[gradeBand].interactiveElements;
}

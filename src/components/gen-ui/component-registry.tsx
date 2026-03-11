import { SkillUnlockedBadge } from '@/components/ui/gamification/SkillUnlockedBadge';
import { AnalogyCard } from '@/components/ui/learning/AnalogyCard';
import { MissionBriefing } from '@/components/ui/quests/MissionBriefing';
import { ShareWidget } from '@/components/ui/collaboration/ShareWidget';
import { HebrewStudyCard } from '@/components/gen-ui/HebrewStudyCard';

// Add any new GenUI components to this registry.
// The key must match the 'component' string returned by the AI agent.
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  SkillUnlockedBadge,
  AnalogyCard,
  MissionBriefing,
  ShareWidget,
  HEBREW_STUDY: HebrewStudyCard,
};


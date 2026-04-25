'use client';

import { RenderMode } from '@/types/lesson';
import { InfographicPosterCard } from '@/components/gen-ui/visual-artifacts/InfographicPosterCard';
import { AnimalInfographicCard } from '@/components/gen-ui/visual-artifacts/AnimalInfographicCard';
import { IllustratedRecipeCard } from '@/components/gen-ui/visual-artifacts/IllustratedRecipeCard';
import { VisualDeepDiveCard } from '@/components/gen-ui/visual-artifacts/VisualDeepDiveCard';

interface VisualArtifactBlockProps {
  blockData: {
    renderMode?: RenderMode;
    content?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

const CARD_MAP: Record<string, React.ComponentType<any>> = {
  infographic_poster: InfographicPosterCard,
  animal_infographic: AnimalInfographicCard,
  illustrated_recipe: IllustratedRecipeCard,
  visual_deep_dive: VisualDeepDiveCard,
};

export default function VisualArtifactBlock({ blockData }: VisualArtifactBlockProps) {
  const mode = blockData.renderMode ?? 'infographic_poster';
  const Card = CARD_MAP[mode];

  if (!Card) {
    return (
      <div className="p-4 rounded-lg border border-[#E7DAC3] bg-[#FAF5E4] text-sm text-[#2F4731]">
        Unknown visual artifact mode: {mode}
      </div>
    );
  }

  const props = blockData.content ?? {};
  return <Card {...props} />;
}

import { BotanicalTree } from '@/components/tree/BotanicalTree';

export default function TreePage() {
  // Sample data - in real app this would come from user's actual progress
  const sampleProgress = [
    {
      trackId: 'gods-creation-science',
      masteredStandards: [
        { standardName: 'Plant Life Cycles', unitName: 'Garden Biology' },
        { standardName: 'Ecosystem Interactions', unitName: 'Homestead Ecology' }
      ]
    },
    {
      trackId: 'homesteading',
      masteredStandards: [
        { standardName: 'Food Preservation', unitName: 'Canning Science' },
        { standardName: 'Animal Care', unitName: 'Chicken Husbandry' }
      ]
    },
    {
      trackId: 'justice-change-making',
      masteredStandards: [
        { standardName: 'Environmental Justice', unitName: 'GMO Investigation' }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-center">
        <BotanicalTree 
          standardsProgress={sampleProgress}
          width={500}
          height={500}
        />
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Award, BookOpen, Calculator, FlaskConical, Feather, MapPin, Users, Gamepad2, ChefHat } from 'lucide-react';

interface ActivityEntry {
  id: string;
  activityName: string;
  mappedSubject: string;
  dateCompleted: Date;
  creditsEarned: number;
  notes?: string;
  metadata?: any;
}

interface JournalTimelineProps {
  groupedActivities: Record<string, ActivityEntry[]>;
}

const SUBJECT_COLORS: Record<string, { bg: string; border: string; text: string; icon: any }> = {
  Math: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', icon: Calculator },
  'Language Arts': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', icon: Feather },
  ELA: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', icon: Feather },
  Reading: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', icon: BookOpen },
  Science: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', icon: FlaskConical },
  History: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', icon: Clock },
  'Social Studies': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', icon: MapPin },
  Bible: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-900', icon: BookOpen },
  Homesteading: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: ChefHat },
  'Domestic Arts': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: ChefHat },
  Community: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-900', icon: Users },
  Arcade: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-900', icon: Gamepad2 },
};

const getSubjectStyle = (subject: string) => {
  return SUBJECT_COLORS[subject] || { 
    bg: 'bg-gray-50', 
    border: 'border-gray-300', 
    text: 'text-gray-900', 
    icon: BookOpen 
  };
};

export function JournalTimeline({ groupedActivities }: JournalTimelineProps) {
  const dateLabels = Object.keys(groupedActivities);

  if (dateLabels.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#2F4731]/60 text-lg">No activities yet. Start your learning journey!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {dateLabels.map((dateLabel) => {
        const activities = groupedActivities[dateLabel];
        
        return (
          <div key={dateLabel} className="relative">
            {/* Date Header */}
            <div className="sticky top-0 z-10 bg-[#FFFEF7]/95 backdrop-blur-sm py-3 mb-4 border-b-2 border-[#E7DAC3]">
              <h2 className="text-2xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                {dateLabel}
              </h2>
            </div>

            {/* Timeline Activities */}
            <div className="space-y-4 pl-8 border-l-4 border-[#E7DAC3]">
              {activities.map((activity) => {
                const style = getSubjectStyle(activity.mappedSubject);
                const Icon = style.icon;
                const completedTime = new Date(activity.dateCompleted).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });

                return (
                  <div key={activity.id} className="relative -ml-10 mb-6">
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-6 w-6 h-6 rounded-full bg-[#BD6809] border-4 border-[#FFFEF7] shadow-md" />

                    {/* Activity Card */}
                    <Card className={`ml-8 ${style.bg} border-2 ${style.border} shadow-md hover:shadow-lg transition-shadow`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${style.bg} border ${style.border}`}>
                              <Icon size={20} className={style.text} />
                            </div>
                            <div>
                              <Badge className={`${style.bg} ${style.text} border ${style.border} font-bold`}>
                                {activity.mappedSubject}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#2F4731]/60">
                            <Clock size={14} />
                            <span>{completedTime}</span>
                          </div>
                        </div>

                        <h3 className={`text-lg font-bold ${style.text} mb-2`}>
                          {activity.activityName}
                        </h3>

                        {activity.notes && (
                          <p className="text-sm text-[#2F4731]/70 mb-3 leading-relaxed">
                            {activity.notes}
                          </p>
                        )}

                        {activity.creditsEarned > 0 && (
                          <div className="flex items-center gap-2 text-sm font-bold text-[#BD6809]">
                            <Award size={16} />
                            <span>+{activity.creditsEarned} credits earned</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

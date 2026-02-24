import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Scroll, Lamp } from 'lucide-react';

export interface HebrewStudyProps {
  englishWord: string;
  hebrewWord: string;
  transliteration: string;
  strongsNumber: string;
  rootMeaning: string;
  biblicalContext: string;
}

export function HebrewStudyCard({
  englishWord, hebrewWord, transliteration, strongsNumber, rootMeaning, biblicalContext
}: HebrewStudyProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Scroll className="w-5 h-5" />
          Hebrew Word Study
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <span className="text-sm text-amber-700 font-medium">English:</span>
              <p className="text-lg font-semibold text-gray-900">{englishWord}</p>
            </div>
            <div>
              <span className="text-sm text-amber-700 font-medium">Hebrew:</span>
              <p className="text-xl font-bold text-amber-900" dir="rtl">{hebrewWord}</p>
            </div>
            <div>
              <span className="text-sm text-amber-700 font-medium">Transliteration:</span>
              <p className="text-lg text-gray-800 italic">{transliteration}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-amber-700 font-medium">Strong's Number:</span>
              <p className="text-lg font-mono text-amber-800">{strongsNumber}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-amber-200 pt-4">
          <div className="flex items-start gap-2 mb-2">
            <Lamp className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
            <span className="text-sm text-amber-700 font-medium">Root Meaning:</span>
          </div>
          <p className="text-gray-800 leading-relaxed">{rootMeaning}</p>
        </div>
        
        <div className="border-t border-amber-200 pt-4">
          <div>
            <span className="text-sm text-amber-700 font-medium">Biblical Context:</span>
            <p className="text-gray-800 leading-relaxed mt-1">{biblicalContext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

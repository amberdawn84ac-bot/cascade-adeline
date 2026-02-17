import { motion } from 'framer-motion';
import { Calendar, Circle } from 'lucide-react';

interface TimelineProps {
  content: string;
}

export function Timeline({ content }: TimelineProps) {
  // Simple parser to extract year/date and event text
  // Expected format: "- 1776: Declaration of Independence" or similar list items
  const items = content.split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d/))
    .map(line => {
      const cleanLine = line.replace(/^-\s*/, '').trim();
      const match = cleanLine.match(/^(\d{4}(?:-\d{4})?|.*?:\s*)(.*)/);
      
      if (match) {
        return {
          date: match[1].replace(/:$/, '').trim(),
          event: match[2].trim()
        };
      }
      return { date: '', event: cleanLine };
    })
    .filter(item => item.event.length > 0);

  // Fallback if parsing fails or content isn't a list
  const displayItems = items.length > 0 ? items : [{ date: 'Overview', event: content }];

  return (
    <div className="bg-white p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8 border-b border-[#E7DAC3] pb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
          <Calendar size={24} />
        </div>
        <h3 className="text-xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Historical Timeline
        </h3>
      </div>

      <div className="relative border-l-2 border-indigo-100 ml-3 md:ml-4 space-y-8 md:space-y-12">
        {displayItems.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-8 md:pl-12"
          >
            {/* Dot */}
            <div className="absolute -left-[9px] top-1 bg-white border-2 border-indigo-400 rounded-full w-4 h-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
              <span className="font-bold text-indigo-600 font-mono text-lg md:text-xl md:w-32 flex-shrink-0">
                {item.date}
              </span>
              <p className="text-[#4B3424] leading-relaxed text-base md:text-lg">
                {item.event}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Calendar, Circle } from 'lucide-react';

interface TimelineProps {
  content: string;
  title?: string;
  events?: Array<{ date: string; event: string }>;
}

export function Timeline({ content, title, events: propEvents }: TimelineProps) {
  console.log('[Timeline] Props received:', { content, title, events: propEvents });
  
  // Use provided events or parse from content
  let parsedEvents = propEvents || [];
  
  if (!propEvents && content) {
    // Enhanced parser to extract year/date and event text
    // Expected format: "- 1776: Declaration of Independence" or similar list items
    parsedEvents = content.split('\n')
      .filter(line => {
        const trimmedLine = line.trim();
        return trimmedLine.startsWith('-') || 
               trimmedLine.match(/^\d/) || 
               trimmedLine.includes(':');
      })
      .map(line => {
        const cleanLine = line.replace(/^-\s*/, '').trim();
        
        // Try multiple date formats
        let match = cleanLine.match(/^(\d{4}(?:-\d{4})?|.*?:\s*)(.*)/);
        
        if (!match) {
          // Try format like "1776 - Declaration of Independence"
          match = cleanLine.match(/^(\d{4})\s*[-—–]\s*(.*)/);
        }
        
        if (!match) {
          // Try format like "Declaration of Independence (1776)"
          match = cleanLine.match(/^(.*)\s*\((\d{4}(?:-\d{4})?)\)\s*$/);
          if (match) {
            // Swap groups for this format
            match = [match[0], match[2], match[1]];
          }
        }
        
        if (match) {
          const date = match[1].replace(/:$/, '').trim();
          const event = match[2].trim();
          return { date: date || 'Unknown', event: event || cleanLine };
        }
        
        // Fallback: treat entire line as event with no date
        return { date: 'Overview', event: cleanLine };
      })
      .filter(item => item.event && item.event.length > 0);
  }
  
  // Fallback if parsing fails or content isn't a list
  const displayEvents = parsedEvents.length > 0 
    ? parsedEvents 
    : content 
      ? [{ date: 'Overview', event: content }]
      : [{ date: 'No Data', event: 'No timeline events available' }];

  console.log('[Timeline] Display events:', displayEvents);

  return (
    <div style={{ padding: '16px 0' }}>
      {title && (
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          color: '#2F4731'
        }}>
          {title}
        </h3>
      )}
      
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: '8px',
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: '#6366F1',
          borderRadius: '1px'
        }} />
        
        {/* Timeline events */}
        {displayEvents.map((item: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            style={{ 
              marginBottom: index < displayEvents.length - 1 ? '20px' : '0',
              position: 'relative'
            }}
          >
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: '-16px',
              top: '4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#6366F1',
              border: '3px solid #FFFEF7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Circle size={6} fill="#FFFEF7" color="#6366F1" />
            </div>
            
            {/* Event content */}
            <div style={{
              backgroundColor: '#F8F9FA',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #E9ECEF'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '4px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6366F1'
              }}>
                <Calendar size={14} style={{ marginRight: '6px' }} />
                {item.date}
              </div>
              <div style={{ 
                fontSize: '14px', 
                lineHeight: '1.4',
                color: '#2F4731'
              }}>
                {item.event}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

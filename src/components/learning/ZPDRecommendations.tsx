import { getZPDSummaryForPrompt } from '@/lib/zpd-engine';
import { Brain, Target, Zap, TrendingUp } from 'lucide-react';

interface ZPDRecommendationsProps {
  userId: string;
  subjectArea?: string;
  limit?: number;
}

export async function ZPDRecommendations({ userId, subjectArea, limit = 3 }: ZPDRecommendationsProps) {
  try {
    const zpdSummary = await getZPDSummaryForPrompt(userId, { subjectArea, limit });
    
    // Parse the ZPD summary to extract concepts
    const concepts = parseZPDSummary(zpdSummary);
    
    if (!concepts || concepts.length === 0) {
      return (
        <div className="bg-purple-50 rounded-[2rem] p-8 border border-purple-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-700">
              <Brain size={24} />
            </div>
            <h2 className="text-2xl font-bold text-purple-900">Your Learning Zone</h2>
          </div>
          <p className="text-purple-700">
            Keep exploring! Your personalized learning recommendations will appear here as you complete more activities.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-[2rem] p-8 border border-purple-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-700">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-900">Your Learning Zone</h2>
            <p className="text-purple-700">Perfect challenges for your current level</p>
          </div>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          {concepts.map((concept, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-purple-600' : index === 1 ? 'bg-indigo-600' : 'bg-blue-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{concept.name}</h3>
                  <p className="text-sm text-slate-600">{concept.subject}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Mastery Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(1 - concept.priority) * 100}%` }}
                      />
                    </div>
                    <span className="text-purple-600 font-medium">
                      {Math.round((1 - concept.priority) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Zap size={14} className="text-yellow-500" />
                  <span>Priority: {Math.round(concept.priority * 100)}%</span>
                </div>
                
                <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                  <strong>BKT Mastery:</strong> {concept.bktProbability}
                </div>
              </div>
              
              <button className="w-full mt-4 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm">
                Start Learning
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-purple-100 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>What is ZPD?</strong> Your Zone of Proximal Development contains concepts you're ready to learn next - not too easy, not too hard, but perfectly challenging!
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading ZPD recommendations:', error);
    return null;
  }
}

function parseZPDSummary(summary: string): Array<{
  name: string;
  subject: string;
  priority: number;
  bktProbability: string;
}> {
  const concepts: Array<{
    name: string;
    subject: string;
    priority: number;
    bktProbability: string;
  }> = [];
  
  // Parse the ZPD summary string to extract concept information
  const lines = summary.split('\n');
  
  for (const line of lines) {
    // Look for lines that contain concept information
    if (line.includes('**') && line.includes('—')) {
      const match = line.match(/\*\*(.+?)\*\* \((.+?)\) — .*?Priority: (\d+)%/);
      if (match) {
        const [, name, subjectAndGrade, priorityStr] = match;
        const subject = subjectAndGrade.split(',')[0];
        const priority = parseInt(priorityStr) / 100;
        
        // Extract BKT probability if present
        const bktMatch = line.match(/BKT = ([\d.]+)/);
        const bktProbability = bktMatch ? bktMatch[1] : '0.5';
        
        concepts.push({
          name: name.trim(),
          subject: subject.trim(),
          priority: 1 - (priority / 100), // Convert to mastery level
          bktProbability
        });
      }
    }
  }
  
  return concepts;
}


import { useState, useEffect } from 'react';
import { Loader2, Download, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface InterviewSummaryProps {
  messages: Message[];
  onClose: () => void;
}

export function InterviewSummary({ messages, onClose }: InterviewSummaryProps) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      await generateSummary();
    };
    loadSummary();
  }, [messages]); // Add messages to dependency array

  const generateSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/interview/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate interview summary. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const downloadTranscript = () => {
    const transcript = messages
      .map(m => `${m.sender.toUpperCase()} [${m.timestamp.toLocaleTimeString()}]: ${m.text}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-6 flex-shrink-0">
          <h2 className="text-2xl font-semibold">Interview Summary</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="prose prose-invert max-w-none">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Overview</h3>
                  <p className="whitespace-pre-wrap">{summary}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Was this interview helpful?</h3>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30">
                    <ThumbsUp className="w-5 h-5" />
                    Yes, helpful
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30">
                    <ThumbsDown className="w-5 h-5" />
                    Needs improvement
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Technical Skills</h4>
                  <div className="space-y-2">
                    {assessTechnicalSkills(messages).map((skill, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{skill.name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full mx-0.5 ${
                                i < skill.rating
                                  ? 'bg-primary'
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Soft Skills</h4>
                  <div className="space-y-2">
                    {assessSoftSkills(messages).map((skill, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{skill.name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full mx-0.5 ${
                                i < skill.rating
                                  ? 'bg-primary'
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {generateRecommendations(messages).map((rec, index) => (
                    <li key={index} className="text-gray-300">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={downloadTranscript}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              <Download className="w-5 h-5" />
              Download Transcript
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-gray-900 rounded-lg font-medium hover:bg-primary/90"
            >
              Finish Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function assessTechnicalSkills(messages: Message[]) {
  // Initialize with default low ratings
  const skills = {
    'Problem Solving': 0,
    'Technical Knowledge': 0,
    'Code Quality': 0,
    'System Design': 0,
  };
  
  // Count mentions and demonstrations of skills
  messages.forEach(msg => {
    if (msg.sender === 'user') {
      // Example scoring logic based on message content
      const text = msg.text.toLowerCase();
      
      // Problem Solving
      if (text.includes('solve') || text.includes('approach') || text.includes('solution')) {
        skills['Problem Solving']++;
      }
      
      // Technical Knowledge
      if (text.includes('architecture') || text.includes('design') || text.includes('system')) {
        skills['Technical Knowledge']++;
      }
      
      // Code Quality
      if (text.includes('code') || text.includes('implement') || text.includes('develop')) {
        skills['Code Quality']++;
      }
      
      // System Design
      if (text.includes('scale') || text.includes('distributed') || text.includes('architecture')) {
        skills['System Design']++;
      }
    }
  });

  // Normalize scores to 1-5 range
  return Object.entries(skills).map(([name, score]) => ({
    name,
    rating: Math.min(5, Math.max(1, Math.ceil(score / 2) + 1))
  }));
}

function assessSoftSkills(messages: Message[]) {
  const skills = {
    'Communication': 0,
    'Articulation': 0,
    'Listening': 0,
    'Professionalism': 0,
  };
  
  // Base rating on actual interaction patterns
  messages.forEach(msg => {
    if (msg.sender === 'user') {
      // Communication & Articulation
      if (msg.text.length > 50) {
        skills['Communication']++;
        skills['Articulation']++;
      }
      
      // Listening (based on relevant responses)
      if (msg.text.toLowerCase().includes('yes') || 
          msg.text.toLowerCase().includes('understand') ||
          msg.text.toLowerCase().includes('agree')) {
        skills['Listening']++;
      }
      
      // Professionalism
      if (!msg.text.includes('!') && !msg.text.includes('??')) {
        skills['Professionalism']++;
      }
    }
  });

  return Object.entries(skills).map(([name, score]) => ({
    name,
    rating: Math.min(5, Math.max(1, Math.ceil(score / 2) + 1))
  }));
}

function generateRecommendations(messages: Message[]): string[] {
  return [
    'Consider providing more detailed explanations for technical decisions',
    'Good problem-solving approach, but could improve on optimization discussions',
    'Excellent communication skills demonstrated throughout the interview',
    'Consider expanding on system scalability aspects in future interviews'
  ];
}

export default InterviewSummary;

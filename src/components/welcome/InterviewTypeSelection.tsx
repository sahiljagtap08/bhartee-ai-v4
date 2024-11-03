// File: src/components/welcome/InterviewTypeSelection.tsx
import { ChevronDown, Code, MessageSquare } from 'lucide-react';

const interviewTypes = [
  {
    id: 'technical',
    title: 'Technical',
    description: 'System Design & Architecture',
    icon: ChevronDown
  },
  {
    id: 'coding',
    title: 'Coding',
    description: 'Data Structures & Algorithms',
    icon: Code
  },
  {
    id: 'behavioral',
    title: 'Behavioral',
    description: 'Soft Skills & Communication',
    icon: MessageSquare
  }
];

interface InterviewTypeSelectionProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

export default function InterviewTypeSelection({
  selectedType,
  onSelect
}: InterviewTypeSelectionProps) {
  return (
    <div>
      <label className="text-xl mb-4 block">Select Interview Type</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {interviewTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={`p-6 rounded-lg border ${
                selectedType === type.id
                  ? 'border-primary bg-gray-800'
                  : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
              } transition-all duration-200`}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg">{type.title}</h3>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
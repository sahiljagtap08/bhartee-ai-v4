// File: src/components/welcome/WelcomeScreen.tsx
"use client"
import { useState } from 'react';
import { ChevronDown, Code, Users, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InterviewTypeSelection from './InterviewTypeSelection';

export default function WelcomeScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const handleContinue = () => {
    if (name && selectedType) {
      router.push(`/interview/${selectedType}?name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-semibold text-center mb-12">
          Welcome to the Interview
        </h1>
        
        <div className="space-y-6">
          <div>
            <label className="text-xl mb-2 block">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <InterviewTypeSelection
            selectedType={selectedType}
            onSelect={setSelectedType}
          />
        </div>

        <button
          onClick={handleContinue}
          disabled={!name || !selectedType}
          className={`w-full py-4 rounded-lg text-lg font-medium transition-all duration-200 ${
            name && selectedType
              ? 'bg-primary hover:bg-primary/90 text-gray-900'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
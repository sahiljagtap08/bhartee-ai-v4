// src/components/interview/CodeEditor.tsx

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RefreshCw, LightbulbIcon, Bug } from 'lucide-react';

interface CodeEditorProps {
  onRun: (code: string, language: string) => Promise<void>;
}

type LanguageKey = 'python' | 'cpp' | 'java' | 'javascript' | 'c';

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' }
] as const;

const LANGUAGE_TEMPLATES: Record<LanguageKey, string> = {
  python: `def solution():
    # Write your solution here
    pass

def test_solution():
    # Write your test cases here
    pass

if __name__ == "__main__":
    test_solution()`,
  
  cpp: `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    // Write your solution here
};

int main() {
    Solution solution;
    // Write your test cases here
    return 0;
}`,
  
  java: `public class Solution {
    // Write your solution here
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        // Write your test cases here
    }
}`,
  
  javascript: `class Solution {
    // Write your solution here
}

function runTests() {
    const solution = new Solution();
    // Write your test cases here
}

runTests();`,
  
  c: `#include <stdio.h>
#include <stdlib.h>

// Write your solution here

int main() {
    // Write your test cases here
    return 0;
}`
};

interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

interface Problem {
  title: string;
  description: string;
  examples: string[];
  testCases: TestCase[];
  hints: string[];
  constraints: string[];
  starterCode?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity?: string;
  spaceComplexity?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ onRun }) => {
  const [language, setLanguage] = useState<LanguageKey>('python');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES[language]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem>({
    title: '',
    description: '',
    examples: [],
    testCases: [],
    hints: [],
    constraints: [],
    difficulty: 'Medium'
  });

  useEffect(() => {
    const loadProblem = async () => {
      await fetchNewProblem();
    };
    loadProblem();
  }, []);  // We can disable the exhaustive-deps rule here as we want this to run only once

  // Move fetchNewProblem inside the component if you need to use hooks
  const fetchNewProblem = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/interview/problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });
      
      if (!response.ok) throw new Error('Failed to fetch problem');
      
      const data = await response.json();
      setProblem(data.problem);
      setCode(data.problem.starterCode || LANGUAGE_TEMPLATES[language]);
      setCurrentHintIndex(0);
      setShowHints(false);
    } catch (error) {
      console.error('Error fetching problem:', error);
      setError('Failed to fetch problem. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const handleLanguageChange = (newLanguage: LanguageKey) => {
    setLanguage(newLanguage);
    setCode(problem.starterCode || LANGUAGE_TEMPLATES[newLanguage]);
  };

  const showNextHint = () => {
    if (currentHintIndex < problem.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setError(null);
    
    try {
      const response = await fetch('/api/interview/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          language,
          testCases: problem.testCases 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run code');
      }

      setOutput(data.output || 'No output');
      await onRun(code, language);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error running code. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-medium">{problem.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
              problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {problem.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as LanguageKey)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button
              onClick={fetchNewProblem}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              New Problem
            </button>
            <button
              onClick={() => setShowHints(!showHints)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <LightbulbIcon className="w-4 h-4" />
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
          </div>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="mb-4">{problem.description}</p>

          {/* Constraints */}
          {problem.constraints.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-400">Constraints:</h4>
              <ul className="list-disc list-inside">
                {problem.constraints.map((constraint, index) => (
                  <li key={index} className="text-sm text-gray-300">{constraint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400">Examples:</h4>
            {problem.examples?.map((example, index) => (
              <div key={index} className="my-2">
                <p className="font-mono text-sm bg-gray-700/50 p-2 rounded">{example}</p>
              </div>
            ))}
          </div>

          {/* Test Cases */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400">Test Cases:</h4>
            <div className="grid grid-cols-2 gap-4">
              {problem.testCases?.map((test, index) => (
                <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="font-mono text-sm">Input: {test.input}</p>
                  <p className="font-mono text-sm">Output: {test.output}</p>
                  {test.explanation && (
                    <p className="text-sm text-gray-400 mt-1">{test.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hints */}
          {showHints && problem.hints.length > 0 && (
            <div className="mb-4 bg-gray-700/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">Hints:</h4>
                {currentHintIndex < problem.hints.length - 1 && (
                  <button
                    onClick={showNextHint}
                    className="text-sm text-primary hover:text-primary/90"
                  >
                    Next Hint
                  </button>
                )}
              </div>
              {problem.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                <p key={index} className="text-sm text-gray-300 mb-2">{hint}</p>
              ))}
            </div>
          )}

          {/* Complexity */}
          {(problem.timeComplexity || problem.spaceComplexity) && (
            <div className="mb-4 text-sm text-gray-400">
              {problem.timeComplexity && (
                <p>Time Complexity: {problem.timeComplexity}</p>
              )}
              {problem.spaceComplexity && (
                <p>Space Complexity: {problem.spaceComplexity}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
            tabSize: 4,
            detectIndentation: true,
            folding: true,
            contextmenu: true,
            showUnused: true,
            parameterHints: { enabled: true },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on'
          }}
        />
      </div>

      <div className="border-t border-gray-700">
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            {error ? (
              <div className="bg-red-900/20 border border-red-900 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Bug className="w-4 h-4 text-red-400 mt-1" />
                  <pre className="text-red-400 text-sm whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap bg-gray-900 rounded-lg p-4 max-h-32 overflow-y-auto">
                {output || 'Output will appear here...'}
              </pre>
            )}
          </div>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-gray-900 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

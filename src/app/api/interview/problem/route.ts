import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { LANGUAGE_TEMPLATES, type LanguageKey } from '@/lib/codeTemplates';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { language } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a technical interviewer generating coding problems. Create a challenging but solvable coding problem that:
          1. Tests algorithmic thinking and problem-solving
          2. Is suitable for a 45-minute technical interview
          3. Has clear requirements and examples
          4. Includes test cases
          5. Has a difficulty level appropriate for a software engineering interview
          6. Is NOT a common leetcode-style problem (no Two Sum, FizzBuzz, etc.)
          7. Tests understanding of data structures and algorithms
          
          Format the response as JSON with:
          {
            "title": "Problem title",
            "description": "Detailed problem description with requirements",
            "examples": ["Example 1: input -> output with explanation", "Example 2: input -> output with explanation"],
            "starterCode": "Language-specific starter code",
            "testCases": [{"input": "test input", "output": "expected output", "explanation": "why"}],
            "hints": ["Hint 1", "Hint 2"],
            "constraints": ["Constraint 1", "Constraint 2"],
            "difficulty": "Medium",
            "timeComplexity": "O(n)",
            "spaceComplexity": "O(n)"
          }`
        }
      ],
      temperature: 0.8
    });

    const problemData = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    // Ensure all required fields exist with defaults
    const problem = {
      title: problemData.title || 'Coding Problem',
      description: problemData.description || 'Please solve this programming problem.',
      examples: problemData.examples || [],
      testCases: problemData.testCases || [],
      hints: problemData.hints || [],
      constraints: problemData.constraints || [],
      starterCode: problemData.starterCode || LANGUAGE_TEMPLATES[language as LanguageKey],
      difficulty: problemData.difficulty || 'Medium',
      timeComplexity: problemData.timeComplexity,
      spaceComplexity: problemData.spaceComplexity
    };
    
    return NextResponse.json({ problem });
  } catch (error) {
    console.error('Error generating problem:', error);
    return NextResponse.json(
      { error: 'Failed to generate problem' },
      { status: 500 }
    );
  }
}
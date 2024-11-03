// File: src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateInterviewQuestion = async (
  type: string,
  previousQuestions: string[]
) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert technical interviewer. Generate a ${type} interview question that hasn't been asked yet.`
      },
      {
        role: "user",
        content: `Previous questions: ${previousQuestions.join(', ')}`
      }
    ]
  });

  return response.choices[0]?.message?.content;
};

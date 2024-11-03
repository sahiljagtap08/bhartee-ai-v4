// src/app/api/interview/run-code/route.ts

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const TIMEOUT = 5000;

const runCode = async (code: string, language: string): Promise<string> => {
  const fileId = uuidv4();
  const tmpDir = path.join(process.cwd(), 'tmp');
  
  try {
    switch (language) {
      case 'python': {
        const filePath = path.join(tmpDir, `${fileId}.py`);
        await writeFile(filePath, code);
        return new Promise((resolve) => {
          exec(`python ${filePath}`, { timeout: TIMEOUT }, (error, stdout, stderr) => {
            if (error) return resolve(stderr || error.message);
            resolve(stdout);
          });
        });
      }
      // ... other cases
      
      default:
        return 'Language not supported yet';
    }
  } catch (err) {
    const error = err as Error;
    return `Error executing code: ${error.message}`;
  }
};

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json();
    const output = await runCode(code, language);
    
    return NextResponse.json({ output });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: 'Failed to execute code', message: error.message },
      { status: 500 }
    );
  }
}
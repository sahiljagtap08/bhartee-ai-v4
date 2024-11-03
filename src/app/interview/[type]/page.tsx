'use client';

import { useParams, useSearchParams } from 'next/navigation';
import InterviewRoom from '@/components/interview/InterviewRoom';
import type { InterviewType } from '@/types/interview';

export default function InterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Add type validation
  const type = params.type as string;
  const validTypes: InterviewType[] = ['technical', 'coding', 'behavioral', 'frontend', 'backend'];
  const validatedType = validTypes.includes(type as InterviewType) 
    ? (type as InterviewType) 
    : 'technical'; // default fallback

  const name = searchParams.get('name');

  return <InterviewRoom type={validatedType} candidateName={name || ''} />;
}

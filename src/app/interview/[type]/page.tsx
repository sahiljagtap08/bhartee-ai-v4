// File: src/app/interview/[type]/page.tsx
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import InterviewRoom from '@/components/interview/InterviewRoom';

export default function InterviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params.type as string;
  const name = searchParams.get('name');

  return <InterviewRoom type={type} candidateName={name || ''} />;
}

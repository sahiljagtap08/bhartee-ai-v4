export interface VideoCallProps {
    onTranscript: (text: string) => void;
    candidateName: string;
    isSpeaking?: boolean;
    isMinimized?: boolean;
  }
  
  export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    type?: 'regular' | 'warning' | 'error';
  }
  
  export interface LiveTranscriptProps {
    onSpeakingChange?: (speaking: boolean) => void;
    onEndInterview?: () => void;
  }
  
  export interface LiveTranscriptHandle {
    addMessage: (text: string, sender: 'user' | 'ai', type?: 'regular' | 'warning' | 'error') => Promise<void>;
    messages: Message[];
  }
  
  export interface InterviewRoomProps {
    type: "technical" | "coding" | "behavioral" | "frontend" | "backend";
    candidateName: string;
  }
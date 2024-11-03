export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    type?: 'regular' | 'warning' | 'error';
    isPartial?: boolean;
  }
  
  export interface LiveTranscriptProps {
    onSpeakingChange?: (speaking: boolean) => void;
    onEndInterview?: () => void;
  }
  
  export interface LiveTranscriptHandle {
    addMessage: (text: string, sender: 'user' | 'ai', type?: 'regular' | 'warning' | 'error') => Promise<void>;
    messages: Message[];
  }
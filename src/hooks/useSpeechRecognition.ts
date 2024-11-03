// src/hooks/useSpeechRecognition.ts
import { useState, useEffect, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onTranscript: (text: string, isPartial: boolean) => void;
  enabled: boolean;
  minSilenceLength?: number;
  confidenceThreshold?: number;
  interimResults?: boolean;
  onError?: (error: Error) => void;
}

export const useSpeechRecognition = ({
  onTranscript,
  enabled,
  minSilenceLength = 1000,
  confidenceThreshold = 0.7,
  interimResults = true,
  onError
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isInitializedRef = useRef(false);
  const currentTranscriptRef = useRef<string>('');
  const lastSpeechTimestampRef = useRef<number>(Date.now());
  const isSpeakingRef = useRef(false);

  const handleError = (error: Error) => {
    setError(error);
    if (onError) onError(error);
    console.error('Speech recognition error:', error);
    setIsStarting(false);
  };

  const cleanupTimeouts = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
  };

  const initializeRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      handleError(new Error('Speech recognition not supported'));
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 3;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setIsStarting(false);
        setError(null);
        retryCountRef.current = 0;
      };

      // src/hooks/useSpeechRecognition.ts (continued)

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setIsStarting(false);
        
        if (!isSpeakingRef.current && currentTranscriptRef.current.trim()) {
          onTranscript(currentTranscriptRef.current.trim(), false);
          currentTranscriptRef.current = '';
        }

        if (enabled && !isStarting && !isSpeakingRef.current) {
          cleanupTimeouts();
          timeoutRef.current = setTimeout(() => {
            startRecognition();
          }, 100);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);
        setIsStarting(false);

        if (event.error === 'not-allowed') {
          handleError(new Error('Microphone access denied'));
          return;
        }

        if (event.error === 'network') {
          handleError(new Error('Network error'));
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            cleanupTimeouts();
            timeoutRef.current = setTimeout(startRecognition, 1000 * retryCountRef.current);
          }
          return;
        }

        // Other errors
        if (event.error !== 'aborted' && event.error !== 'no-speech' && enabled) {
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            cleanupTimeouts();
            timeoutRef.current = setTimeout(startRecognition, 1000 * retryCountRef.current);
          } else {
            handleError(new Error(`Recognition failed after ${maxRetries} attempts`));
          }
        }
      };

      recognition.onresult = (event: any) => {
        if (isSpeakingRef.current) return; // Ignore results when AI is speaking
        
        try {
          lastSpeechTimestampRef.current = Date.now();
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;

            if (confidence < confidenceThreshold) continue;

            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript = transcript;
            }
          }

          if (finalTranscript) {
            currentTranscriptRef.current += finalTranscript;
          }

          if (interimTranscript && interimResults) {
            onTranscript(interimTranscript, true);
          }

          cleanupTimeouts();
          silenceTimeoutRef.current = setTimeout(() => {
            if (currentTranscriptRef.current && !isSpeakingRef.current) {
              onTranscript(currentTranscriptRef.current.trim(), false);
              currentTranscriptRef.current = '';
            }
          }, minSilenceLength);

        } catch (error) {
          handleError(error as Error);
        }
      };

      recognitionRef.current = recognition;
      isInitializedRef.current = true;
    } catch (error) {
      handleError(error as Error);
    }
  };

  const startRecognition = async () => {
    if (!recognitionRef.current || isStarting || isListening || isSpeakingRef.current) return;

    try {
      setIsStarting(true);
      await recognitionRef.current.start();
    } catch (error) {
      if (error instanceof Error && error.message.includes('already started')) {
        try {
          await recognitionRef.current.stop();
          setTimeout(startRecognition, 100);
        } catch (stopError) {
          handleError(stopError as Error);
        }
      } else {
        handleError(error as Error);
      }
      setIsStarting(false);
    }
  };

  const stopRecognition = () => {
    cleanupTimeouts();
    setIsStarting(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        currentTranscriptRef.current = '';
      } catch (error) {
        handleError(error as Error);
      }
    }
  };

  useEffect(() => {
    if (enabled && !isInitializedRef.current) {
      initializeRecognition();
      startRecognition();
    }

    return () => {
      cleanupTimeouts();
      stopRecognition();
      isInitializedRef.current = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && !isSpeakingRef.current) {
      if (!isListening && !isStarting) {
        startRecognition();
      }
    } else {
      stopRecognition();
    }
  }, [enabled, isListening, isSpeakingRef.current]);

  const setIsSpeaking = (speaking: boolean) => {
    isSpeakingRef.current = speaking;
    if (speaking) {
      stopRecognition();
    } else {
      timeoutRef.current = setTimeout(() => {
        if (enabled) {
          startRecognition();
        }
      }, 100);
    }
  };

  return {
    isListening,
    isStarting,
    error,
    setIsSpeaking,
    currentTranscript: currentTranscriptRef.current,
    lastSpeechTimestamp: lastSpeechTimestampRef.current,
  };
};


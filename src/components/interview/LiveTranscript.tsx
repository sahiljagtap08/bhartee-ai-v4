// src/components/interview/LiveTranscript.tsx

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  MessageCircle,
  X,
  Mic,
  MicOff,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { InterviewSummary } from "./InterviewSummary";
import { INTERVIEWER_CONFIG } from "@/config/interviewer";
import { voiceService } from "@/lib/voiceService";

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
interface InterimTranscript {
  text: string;
  timestamp: Date;
}

const LiveTranscript = forwardRef<LiveTranscriptHandle, LiveTranscriptProps>(
  ({ onSpeakingChange }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [interimTranscript, setInterimTranscript] =
      useState<InterimTranscript | null>(null);
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warningCount, setWarningCount] = useState(0);
    const [isInterviewEnded, setIsInterviewEnded] = useState(false);

    const transcriptRef = useRef<HTMLDivElement>(null);
    const messageQueueRef = useRef<Message[]>([]);
    const processingQueueRef = useRef(false);
    const lastTranscriptRef = useRef<string>("");

    const { isListening, setIsSpeaking: setSpeechRecognitionSpeaking } =
      useSpeechRecognition({
        onTranscript: (text, isPartial) => {
          if (isPartial) {
            setInterimTranscript({
              text,
              timestamp: new Date(),
            });
          } else if (
            !isSpeaking &&
            text.trim() &&
            !isProcessing &&
            isSpeechEnabled
          ) {
            setInterimTranscript(null);
            handleUserInput(text);
          }
        },
        enabled: isSpeechEnabled && !isInterviewEnded,
        minSilenceLength: 1000,
        confidenceThreshold: 0.7,
        interimResults: true,
      });

    useEffect(() => {
      voiceService.warmup().catch(console.error);
      return () => {
        voiceService.clearCache();
        voiceService.stop();
      };
    }, []);

    useEffect(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    }, [messages, interimTranscript]);

    const processMessageQueue = async () => {
      if (processingQueueRef.current || messageQueueRef.current.length === 0)
        return;

      processingQueueRef.current = true;
      const message = messageQueueRef.current.shift()!;

      try {
        if (message.sender === "ai") {
          await handleSpeakingStateChange(true);
          await voiceService.speak(message.text);
          await handleSpeakingStateChange(false);
        }

        setMessages((prev) => [...prev, message]);
      } catch (error) {
        console.error("Error processing message:", error);
        setError("Error processing message. Please try again.");
      } finally {
        processingQueueRef.current = false;
        processMessageQueue();
      }
    };

    const handleSpeakingStateChange = async (speaking: boolean) => {
      setIsSpeaking(speaking);
      setSpeechRecognitionSpeaking(speaking);
      onSpeakingChange?.(speaking);
    };

    const checkForInappropriateLanguage = (text: string): boolean => {
      const profanityList = ["profanity1", "profanity2"]; // Add actual profanity list
      return profanityList.some((word) => text.toLowerCase().includes(word));
    };

    const handleUserInput = async (text: string) => {
      if (text === lastTranscriptRef.current || isInterviewEnded) return;

      lastTranscriptRef.current = text;

      if (checkForInappropriateLanguage(text)) {
        warningCount >= 2 ? endInterviewDueToViolation() : issueWarning();
        return;
      }

      await addMessage(text, "user");
    };

    const issueWarning = async () => {
      setWarningCount((prev) => prev + 1);
      await addMessage(INTERVIEWER_CONFIG.warningMessage, "ai", "warning");
    };

    const endInterviewDueToViolation = async () => {
      await addMessage(INTERVIEWER_CONFIG.terminationMessage, "ai", "error");
      setIsInterviewEnded(true);
      setShowSummary(true);
    };

    const toggleSpeech = () => {
      if (isSpeaking || isInterviewEnded) return;
      setIsSpeechEnabled(!isSpeechEnabled);
      setInterimTranscript(null);
    };

    const endInterview = async () => {
      if (isSpeaking || loading) return;

      setIsSpeechEnabled(false);
      voiceService.stop();
      setIsInterviewEnded(true);
      setInterimTranscript(null);

      try {
        await addMessage(
          "Thank you for participating in this interview. I'll now generate a summary of our discussion.",
          "ai"
        );
        setShowSummary(true);
      } catch (error) {
        setError("Failed to end interview properly. Please try again.");
      }
    };

    const addMessage = async (
      text: string,
      sender: "user" | "ai",
      type: "regular" | "warning" | "error" = "regular"
    ) => {
      if (!text.trim() || isInterviewEnded) return;

      const newMessage: Message = {
        id: Date.now().toString(),
        text: text.trim(),
        sender,
        timestamp: new Date(),
        type,
      };

      if (sender === "user" && !isSpeaking) {
        setLoading(true);
        setIsProcessing(true);

        try {
          const response = await fetch("/api/interview/response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              context: messages,
              warningCount,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          messageQueueRef.current.push(newMessage);

          if (data.reply) {
            messageQueueRef.current.push({
              id: Date.now().toString(),
              text: data.reply,
              sender: "ai",
              timestamp: new Date(),
              type: "regular",
            });
          }

          processMessageQueue();
        } catch (error) {
          console.error("Error in message handling:", error);
          setError("Failed to process message. Please try again.");
          messageQueueRef.current.push({
            id: Date.now().toString(),
            text: "Sorry, I encountered an error. Could you please repeat that?",
            sender: "ai",
            timestamp: new Date(),
            type: "error",
          });
          processMessageQueue();
        } finally {
          setLoading(false);
          setIsProcessing(false);
        }
      } else {
        messageQueueRef.current.push(newMessage);
        processMessageQueue();
      }
    };

    useImperativeHandle(ref, () => ({
      addMessage,
      messages,
    }));

    return (
      <div className="h-full flex flex-col bg-gray-800 rounded-lg">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Live Transcript
              {isSpeaking && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-2 text-sm text-primary"
                >
                  Speaking...
                </motion.span>
              )}
              {!isSpeaking && isListening && isSpeechEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-2 text-sm text-green-400 flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Listening...
                </motion.div>
              )}
            </h3>
            <button
              onClick={toggleSpeech}
              disabled={isSpeaking || isInterviewEnded}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                isSpeaking
                  ? "bg-yellow-500/20 text-yellow-400 cursor-not-allowed"
                  : isSpeechEnabled
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              } disabled:opacity-50`}
            >
              {isSpeaking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Speaking...
                </>
              ) : isSpeechEnabled ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Speaking
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Speaking
                </>
              )}
            </button>
          </div>

          {warningCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              Warning {warningCount}/3
            </div>
          )}

          <button
            onClick={endInterview}
            disabled={isSpeaking || loading || isInterviewEnded}
            className="flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            End Interview
          </button>
        </div>

        {error && (
          <div className="p-2 bg-red-500/10 border-l-4 border-red-500">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-700"
        >
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.sender === "ai" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "ai"
                    ? message.type === "warning"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : message.type === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-gray-700"
                    : "bg-primary text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}

          {interimTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-700/50">
                <p className="whitespace-pre-wrap break-words italic">
                  {interimTranscript.text}...
                </p>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {showSummary && (
          <InterviewSummary
            messages={messages}
            onClose={() => {
              setShowSummary(false);
              window.location.href = "/";
            }}
          />
        )}
      </div>
    );
  }
);

LiveTranscript.displayName = "LiveTranscript";

export default LiveTranscript;

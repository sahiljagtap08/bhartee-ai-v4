import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import VideoCall from "./VideoCall";
import LiveTranscript from "./LiveTranscript";
import PreJoinScreen from "./PreJoinScreen";
import type { InterviewRoomProps, LiveTranscriptHandle } from '@/types/interview';

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

export default function InterviewRoom({ type, candidateName }: InterviewRoomProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const transcriptRef = useRef<LiveTranscriptHandle>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isJoined && !hasStartedRef.current && transcriptRef.current) {
      hasStartedRef.current = true;
      setTimeout(() => {
        transcriptRef.current?.addMessage(
          generateInitialGreeting(type, candidateName),
          "ai"
        );
        setIsReady(true);
      }, 1500);
    }
  }, [isJoined, candidateName, type]);

  const generateInitialGreeting = (type: string, name: string): string => {
    const greetings = [
      `Hello ${name}! I'm Mike, your ${type} interviewer today. Thank you for joining us.`,
      `Welcome to your ${type} interview! I'm Mike, and I'm excited to learn more about your experience.`,
      `Hi ${name}! I'm Mike, and I'll be conducting your ${type} interview today.`,
    ];

    const followUp =
      type === "coding"
        ? " We'll be working through some coding challenges together. Could you start by telling me about your programming background?"
        : " Could you start by telling me about your background and experience?";

    return greetings[Math.floor(Math.random() * greetings.length)] + followUp;
  };

  const handleTranscript = async (text: string) => {
    if (transcriptRef.current && isReady) {
      await transcriptRef.current.addMessage(text, "user");
    }
  };

  const handleCodeRun = async (code: string, language: string) => {
    if (transcriptRef.current && isReady) {
      await transcriptRef.current.addMessage(
        `I've submitted my solution in ${language}. Please review it.`,
        "user"
      );
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
  };

  if (!isJoined) {
    return <PreJoinScreen onJoin={() => setIsJoined(true)} />;
  }

  if (type === "coding") {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        <div className="flex-1 flex relative">
          {/* Code Editor */}
          <div className={`${isVideoMinimized ? 'w-full' : 'w-3/4'} transition-all duration-300`}>
            <CodeEditor onRun={handleCodeRun} />
          </div>

          {/* Video Container */}
          <AnimatePresence>
            {isVideoMinimized ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed top-4 right-4 w-72 h-48 rounded-lg overflow-hidden shadow-lg border border-gray-700/50 z-20"
              >
                <VideoCall
                  onTranscript={handleTranscript}
                  candidateName={candidateName}
                  isSpeaking={isSpeaking}
                  isMinimized={true}
                />
                <button
                  onClick={() => setIsVideoMinimized(false)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-800/80 rounded-full hover:bg-gray-700/80 text-white"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-1/4 p-4"
              >
                <div className="h-full rounded-xl overflow-hidden relative">
                  <VideoCall
                    onTranscript={handleTranscript}
                    candidateName={candidateName}
                    isSpeaking={isSpeaking}
                    isMinimized={false}
                  />
                  <button
                    onClick={() => setIsVideoMinimized(true)}
                    className="absolute top-2 right-2 p-1.5 bg-gray-800/80 rounded-full hover:bg-gray-700/80 text-white"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript Toggle Button */}
          <button
            onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
            className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-30 ${
              isTranscriptVisible 
                ? 'bg-primary text-gray-900' 
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
          </button>

          {/* Transcript Panel */}
          <AnimatePresence>
            {isTranscriptVisible && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20 }}
                className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 shadow-xl border-l border-gray-700/50 z-10"
              >
                <LiveTranscript
                  ref={transcriptRef}
                  onSpeakingChange={handleSpeakingChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Non-coding interview layout
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="h-screen flex">
        <div className="flex w-full">
          <div className="w-1/2 p-4 border-r border-gray-700/50">
            <div className="h-full rounded-xl overflow-hidden">
              <VideoCall
                onTranscript={handleTranscript}
                candidateName={candidateName}
                isSpeaking={isSpeaking}
              />
            </div>
          </div>
          <div className="w-1/2">
            <LiveTranscript
              ref={transcriptRef}
              onSpeakingChange={handleSpeakingChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
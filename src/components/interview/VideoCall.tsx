import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Camera, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VideoCallProps } from '@/types/interview';
import Image from 'next/image';


export default function VideoCall({
  onTranscript,
  candidateName,
  isSpeaking,
  isMinimized = false
}: VideoCallProps) {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeMedia();
    return () => {
      stopMediaStream();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      setIsLoading(true);
      const savedSettings = localStorage.getItem('interviewSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: settings?.selectedCamera ? { deviceId: settings.selectedCamera } : true,
        audio: settings?.selectedMicrophone ? { deviceId: settings.selectedMicrophone } : true
      });
      
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasPermissions(true);
      setError(null);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasPermissions(false);
      setError('Unable to access camera or microphone. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"/>
          <p className="text-gray-400">Initializing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${isMinimized ? 'video-minimized' : ''}`}>
      <div className="absolute inset-0 rounded-lg overflow-hidden bg-gray-800">
        <div className="relative w-full h-full">
          {/* Video Element */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror-mode"
          />
          
          {/* Camera Off State */}
          {!isCameraOn && (
            <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center">
              <p className="text-gray-400">Camera is turned off</p>
            </div>
          )}

          {/* Name Tag */}
          <div 
            className={`absolute top-2 left-2 transition-transform ${
              isMinimized ? 'scale-75 origin-top-left' : ''
            }`}
          >
            <div className="px-2 py-1 bg-gray-900/80 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium text-white">
                {candidateName} (You)
              </p>
            </div>
          </div>

          {/* Controls - Hidden when minimized */}
          {!isMinimized && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-gray-900/90 to-transparent">
              <div className="flex justify-center space-x-3">
                <button
                  onClick={toggleMic}
                  className={`p-2 rounded-full transition-colors ${
                    isMicOn ? 'bg-white text-gray-900' : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded-full transition-colors ${
                    isCameraOn ? 'bg-white text-gray-900' : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Speaking Indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${
              isMinimized ? 'bottom-1 right-1 scale-75' : 'bottom-4 right-4'
            }`}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary shadow-glow">
  <Image
    src="/interviewer-avatar.png"
    alt="AI Interviewer"
    width={32}
    height={32}
    className="w-full h-full object-cover"
  />
</div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/20 rounded-full">
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] text-primary font-medium">AI</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// src/components/interview/PreJoinScreen.tsx

import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, Loader2 } from 'lucide-react';

interface PreJoinScreenProps {
  onJoin: () => void;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

export default function PreJoinScreen({ onJoin }: PreJoinScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Device states
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [microphones, setMicrophones] = useState<MediaDevice[]>([]);
  const [speakers, setSpeakers] = useState<MediaDevice[]>([]);
  
  // Selected device states
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeDevices();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeDevices = async () => {
    try {
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStream(initialStream);
      if (videoRef.current) {
        videoRef.current.srcObject = initialStream;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');

      setCameras(videoDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${videoDevices.indexOf(device) + 1}`
      })));

      setMicrophones(audioInputDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${audioInputDevices.indexOf(device) + 1}`
      })));

      setSpeakers(audioOutputDevices.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Speaker ${audioOutputDevices.indexOf(device) + 1}`
      })));

      if (videoDevices.length) setSelectedCamera(videoDevices[0].deviceId);
      if (audioInputDevices.length) setSelectedMicrophone(audioInputDevices[0].deviceId);
      if (audioOutputDevices.length) setSelectedSpeaker(audioOutputDevices[0].deviceId);

      setError(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing devices:', error);
      setError('Failed to access media devices. Please ensure camera and microphone permissions are granted.');
      setIsLoading(false);
    }
  };

  const handleDeviceChange = async (deviceId: string, type: 'audio' | 'video') => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? { deviceId } : isCameraEnabled,
        audio: type === 'audio' ? { deviceId } : isMicrophoneEnabled
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error changing device:', error);
      setError(`Failed to switch ${type} device`);
    }
  };

  const toggleDevice = (type: 'camera' | 'microphone') => {
    if (!stream) return;

    if (type === 'camera') {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    } else {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicrophoneEnabled(audioTrack.enabled);
      }
    }
  };

  const handleJoin = () => {
    // Save settings to localStorage
    const settings = {
      selectedCamera,
      selectedMicrophone,
      selectedSpeaker,
      isCameraEnabled,
      isMicrophoneEnabled
    };
    
    localStorage.setItem('interviewSettings', JSON.stringify(settings));
    onJoin();
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-400">Initializing devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Ready to join?</h2>
          <button
            onClick={initializeDevices}
            className="text-sm text-primary hover:text-primary/90"
          >
            Refresh Devices
          </button>
        </div>

        <p className="text-gray-400">AI Interviewer is ready for the call</p>

        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isCameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <p className="text-gray-400">Camera is disabled</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Camera Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-primary" />
                <span>Camera</span>
              </label>
              <button
                onClick={() => toggleDevice('camera')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  isCameraEnabled 
                    ? 'bg-green-900/20 text-green-400'
                    : 'bg-red-900/20 text-red-400'
                }`}
              >
                {isCameraEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <select
              value={selectedCamera}
              onChange={(e) => {
                setSelectedCamera(e.target.value);
                handleDeviceChange(e.target.value, 'video');
              }}
              disabled={!isCameraEnabled}
              className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {cameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-primary" />
                <span>Microphone</span>
              </label>
              <button
                onClick={() => toggleDevice('microphone')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  isMicrophoneEnabled 
                    ? 'bg-green-900/20 text-green-400'
                    : 'bg-red-900/20 text-red-400'
                }`}
              >
                {isMicrophoneEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <select
              value={selectedMicrophone}
              onChange={(e) => {
                setSelectedMicrophone(e.target.value);
                handleDeviceChange(e.target.value, 'audio');
              }}
              disabled={!isMicrophoneEnabled}
              className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {microphones.map((microphone) => (
                <option key={microphone.deviceId} value={microphone.deviceId}>
                  {microphone.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speaker Selection */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-primary" />
              <span>Speaker</span>
            </label>
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary"
            >
              {speakers.map((speaker) => (
                <option key={speaker.deviceId} value={speaker.deviceId}>
                  {speaker.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleJoin}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-gray-900 rounded-lg font-medium transition-all duration-200"
        >
          Join Interview
        </button>
      </div>
    </div>
  );
}
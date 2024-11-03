// src/config/elevenlabs.ts

export const ELEVENLABS_CONFIG = {
    API_URL: 'https://api.elevenlabs.io/v1',
    DEFAULT_VOICE_ID: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '',
    API_KEY: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
    VOICE_SETTINGS: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  };
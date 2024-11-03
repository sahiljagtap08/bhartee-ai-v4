// src/lib/voiceService.ts

import { ELEVENLABS_CONFIG } from '@/config/elevenlabs';

interface VoiceOptions {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

interface AudioQueueItem {
  text: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

type SpeakingChangeCallback = (speaking: boolean) => void;

class VoiceService {
  private static instance: VoiceService;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioQueueItem[] = [];
  private isProcessing: boolean = false;
  private voiceCache: Map<string, ArrayBuffer> = new Map();
  private lastSpeechTimestamp: number = 0;
  private onSpeakingChange?: SpeakingChangeCallback;
  private currentAudioSource?: AudioBufferSourceNode;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isMuted: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new AudioContext();
    }
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public setOnSpeakingChange(callback: SpeakingChangeCallback) {
    this.onSpeakingChange = callback;
  }

  private notifySpeakingChange(speaking: boolean) {
    if (this.onSpeakingChange) {
      this.onSpeakingChange(speaking);
    }
  }

  private async generateSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(
        `${ELEVENLABS_CONFIG.API_URL}/text-to-speech/${ELEVENLABS_CONFIG.DEFAULT_VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_CONFIG.API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: ELEVENLABS_CONFIG.VOICE_SETTINGS.stability,
              similarity_boost: ELEVENLABS_CONFIG.VOICE_SETTINGS.similarity_boost,
              style: ELEVENLABS_CONFIG.VOICE_SETTINGS.style,
              use_speaker_boost: ELEVENLABS_CONFIG.VOICE_SETTINGS.use_speaker_boost
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Speech generation failed: ${response.status}`);
      }

      return response.arrayBuffer();
    } catch (error) {
      console.error('Error generating speech:', error);
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying speech generation (attempt ${this.retryCount})...`);
        return this.generateSpeech(text);
      }
      throw error;
    }
  }

  private getCacheKey(text: string): string {
    const normalizedText = text.toLowerCase().trim();
    return `voice_${normalizedText.slice(0, 100)}_${ELEVENLABS_CONFIG.DEFAULT_VOICE_ID}`;
  }

  private async playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      // Stop any currently playing audio
      if (this.currentAudioSource) {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer);
      source.buffer = decodedAudio;
      
      // Connect the source to gain node and gain node to destination
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set volume based on mute state
      gainNode.gain.value = this.isMuted ? 0 : 1;
      
      this.currentAudioSource = source;

      return new Promise((resolve) => {
        source.addEventListener('ended', () => {
          this.lastSpeechTimestamp = Date.now();
          source.disconnect();
          gainNode.disconnect();
          this.currentAudioSource = undefined;
          resolve();
        });
        
        source.start(0);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  private async fallbackToSystemTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMuted) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.voice = window.speechSynthesis.getVoices().find(voice => 
        voice.name.toLowerCase().includes('male')
      ) || null;

      utterance.onend = () => {
        this.lastSpeechTimestamp = Date.now();
        resolve();
      };
      utterance.onerror = reject;

      window.speechSynthesis.speak(utterance);
    });
  }

  public async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioQueue.push({
        text,
        onStart: () => {
          this.notifySpeakingChange(true);
        },
        onComplete: () => {
          this.notifySpeakingChange(false);
          resolve();
        },
        onError: reject
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.audioQueue.length === 0) return;

    this.isProcessing = true;
    const item = this.audioQueue[0];

    try {
      if (item.onStart) item.onStart();

      const cacheKey = this.getCacheKey(item.text);
      let audioBuffer: ArrayBuffer;

      if (this.voiceCache.has(cacheKey)) {
        audioBuffer = this.voiceCache.get(cacheKey)!;
      } else {
        audioBuffer = await this.generateSpeech(item.text);
        this.voiceCache.set(cacheKey, audioBuffer);
      }

      await this.playAudioBuffer(audioBuffer);
      
      if (item.onComplete) item.onComplete();
    } catch (error) {
      console.error('Error in speech processing:', error);
      try {
        await this.fallbackToSystemTTS(item.text);
        if (item.onComplete) item.onComplete();
      } catch (fallbackError) {
        if (item.onError) item.onError(fallbackError as Error);
      }
    } finally {
      this.audioQueue.shift();
      this.isProcessing = false;
      this.processQueue();
    }
  }

  public async warmup(): Promise<void> {
    const warmupText = "Hello! I'm Mike, your interviewer today.";
    try {
      const audioBuffer = await this.generateSpeech(warmupText);
      this.voiceCache.set(this.getCacheKey(warmupText), audioBuffer);
    } catch (error) {
      console.error('Warmup failed:', error);
    }
  }

  public clearCache(): void {
    this.voiceCache.clear();
  }

  public stop(): void {
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource.disconnect();
      this.currentAudioSource = undefined;
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
    }
    
    window.speechSynthesis.cancel();
    this.audioQueue = [];
    this.isProcessing = false;
    this.notifySpeakingChange(false);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audioContext && this.currentAudioSource) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = muted ? 0 : 1;
      this.currentAudioSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
    }
  }

  public pause(): void {
    if (this.audioContext) {
      this.audioContext.suspend();
    }
    window.speechSynthesis.pause();
  }

  public resume(): void {
    if (this.audioContext) {
      this.audioContext.resume();
    }
    window.speechSynthesis.resume();
  }

  public get isSpeaking(): boolean {
    return this.isProcessing;
  }

  public get lastSpeechTime(): number {
    return this.lastSpeechTimestamp;
  }

  public async preloadVoices(texts: string[]): Promise<void> {
    const promises = texts.map(async (text) => {
      const cacheKey = this.getCacheKey(text);
      if (!this.voiceCache.has(cacheKey)) {
        try {
          const audioBuffer = await this.generateSpeech(text);
          this.voiceCache.set(cacheKey, audioBuffer);
        } catch (error) {
          console.error(`Failed to preload voice for text: ${text}`, error);
        }
      }
    });

    await Promise.all(promises);
  }
}

export const voiceService = VoiceService.getInstance();

// Optional: Export types for use in other components
export type { VoiceOptions, SpeakingChangeCallback };
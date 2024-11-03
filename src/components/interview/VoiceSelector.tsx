// src/components/interview/VoiceSelector.tsx
import { useState, useEffect } from 'react';

interface Voice {
  voice_id: string;
  name: string;
}

export default function VoiceSelector({ onVoiceSelect }: { onVoiceSelect: (voiceId: string) => void }) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          },
        });
        const data = await response.json();
        setVoices(data.voices);
      } catch (error) {
        console.error('Error fetching voices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  if (loading) {
    return <div>Loading voices...</div>;
  }

  return (
    <select 
      onChange={(e) => onVoiceSelect(e.target.value)}
      className="bg-gray-800 text-white p-2 rounded-lg"
    >
      {voices.map((voice) => (
        <option key={voice.voice_id} value={voice.voice_id}>
          {voice.name}
        </option>
      ))}
    </select>
  );
}
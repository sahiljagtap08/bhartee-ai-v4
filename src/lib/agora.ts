// File: src/lib/agora.ts
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8'
});

export const initializeAgora = async (channelName: string) => {
  await client.join(
    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    channelName,
    null,
    null
  );
  
  const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  const localVideoTrack = await AgoraRTC.createCameraVideoTrack();
  
  await client.publish([localAudioTrack, localVideoTrack]);
  
  return {
    client,
    localAudioTrack,
    localVideoTrack
  };
};

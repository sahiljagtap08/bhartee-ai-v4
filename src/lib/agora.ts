import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8'
});

export const initializeAgora = async (channelName: string) => {
  if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
    throw new Error('Agora App ID not found');
  }

  try {
    await client.join(
      process.env.NEXT_PUBLIC_AGORA_APP_ID,
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
  } catch (error) {
    console.error('Error initializing Agora:', error);
    throw error;
  }
};

export const leaveChannel = async () => {
  try {
    await client.leave();
  } catch (error) {
    console.error('Error leaving channel:', error);
    throw error;
  }
};

export default client;

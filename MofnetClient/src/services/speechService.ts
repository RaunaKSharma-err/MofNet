import { Platform } from 'react-native';
import { Audio } from 'expo-av';

import { getApiBaseUrl } from '@/src/config/api';

const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<string> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Audio recording permission denied');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(RECORDING_OPTIONS);
  await recording.startAsync();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stopRecording().then(() => resolve('')).catch(() => reject(new Error('Recording timeout')));
    }, 60000);

    recording?.setOnRecordingStatusUpdate((status) => {
      if (status.isDoneRecording) {
        clearTimeout(timeout);
        resolve('');
      }
    });
  });
}

export async function stopRecording(): Promise<string> {
  if (!recording) {
    return '';
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;
    return uri || '';
  } catch {
    recording = null;
    return '';
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const baseUrl = getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'web' ? audioUri : audioUri,
    type: 'audio/wav',
    name: 'recording.wav',
  } as any);

  const response = await fetch(`${baseUrl}/speech/transcribe`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

export async function voiceChat(audioUri: string, grade?: number, subject?: string): Promise<{
  transcription: string;
  answer: string;
  audioUrl?: string;
}> {
  const baseUrl = getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'web' ? audioUri : audioUri,
    type: 'audio/wav',
    name: 'recording.wav',
  } as any);

  const params = new URLSearchParams();
  if (grade) params.set('grade', String(grade));
  if (subject) params.set('subject', subject);

  const response = await fetch(`${baseUrl}/speech/chat?${params.toString()}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error(`Voice chat failed: ${response.status}`);
  }

  return response.json();
}

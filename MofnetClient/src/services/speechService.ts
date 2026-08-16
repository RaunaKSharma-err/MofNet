import { Platform } from 'react-native';
import { Audio } from 'expo-av';

import { getApiBaseUrl } from '@/src/config/api';

const RECORDING_OPTIONS = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    audioBitRate: 16,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
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

export async function voiceChatStream(
  audioUri: string,
  grade?: number,
  subject?: string,
  onChunk?: (chunk: string) => void,
  onComplete?: (answer: string, transcription: string, cached: boolean) => void,
  onError?: (error: string) => void,
): Promise<void> {
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

  const urls = [baseUrl, getFallbackApiUrl()];
  let lastError = '';

  for (const url of urls) {
    try {
      const response = await fetch(`${url}/speech/chat/stream?${params.toString()}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        lastError = 'No readable stream';
        continue;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let transcription = '';
      let answer = '';
      let cached = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                if (onError) onError(parsed.error);
                return;
              }
              if (parsed.transcription && !transcription) {
                transcription = parsed.transcription;
              }
              if (parsed.cached !== undefined) {
                cached = parsed.cached;
              }
              if (parsed.chunk) {
                answer += parsed.chunk;
                if (onChunk) onChunk(parsed.chunk);
              }
              if (parsed.done) {
                if (onComplete) onComplete(answer, transcription, cached);
                return;
              }
            } catch {
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return;
    } catch (err) {
      lastError = String(err);
      continue;
    }
  }

  const fallback = await voiceChat(audioUri, grade, subject);
  if (fallback) {
    if (onComplete) onComplete(fallback.answer, fallback.transcription, false);
    return;
  }

  if (onError) onError(lastError || 'Voice chat failed');
}

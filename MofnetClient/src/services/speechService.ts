import { Platform } from 'react-native';
import { Audio } from 'expo-av';

import { getApiBaseUrl, getFallbackApiUrl } from '@/src/config/api';

const RECORDING_OPTIONS = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.WAV,
    audioEncoder: Audio.AndroidAudioEncoder.PCM_16BIT,
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

async function readFileAsBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function xhrPostWithTimeout(
  url: string,
  body: FormData,
  timeoutMs = 120000,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    const timeout = setTimeout(() => {
      xhr.abort();
      reject(new Error('Request timed out'));
    }, timeoutMs);

    xhr.onload = () => {
      clearTimeout(timeout);
      resolve({
        status: xhr.status,
        text: xhr.responseText,
      });
    };

    xhr.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Network error: ${xhr.statusText || 'unknown'}`));
    };

    xhr.ontimeout = () => {
      reject(new Error('Request timed out'));
    };

    xhr.send(body);
  });
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'web' ? audioUri : audioUri,
    type: 'audio/wav',
    name: 'recording.wav',
  } as any);

  const result = await xhrPostWithTimeout(`${baseUrl}/speech/transcribe`, formData);

  if (result.status !== 200) {
    throw new Error(`Transcription failed: ${result.status}`);
  }

  const data = JSON.parse(result.text);
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
  if (subject) params.set('subject', String(subject));

  const result = await xhrPostWithTimeout(`${baseUrl}/speech/chat?${params.toString()}`, formData);

  if (result.status !== 200) {
    throw new Error(`Voice chat failed: ${result.status}`);
  }

  return JSON.parse(result.text);
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
  console.log('[VOICE] voiceChatStream starting, audioUri:', audioUri, 'baseUrl:', baseUrl);

  const buildUrl = (base: string) => {
    const p = new URLSearchParams();
    if (grade) p.set('grade', String(grade));
    if (subject) p.set('subject', String(subject));
    return `${base}/speech/chat/stream?${p.toString()}`;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('file', {
      uri: Platform.OS === 'web' ? audioUri : audioUri,
      type: 'audio/wav',
      name: 'recording.wav',
    } as any);
    return fd;
  };

  const urls = [baseUrl, getFallbackApiUrl()];
  let lastError = '';

  for (const url of urls) {
    try {
      console.log('[VOICE] Trying URL:', buildUrl(url));
      const result = await xhrPostWithTimeout(buildUrl(url), buildFormData(), 180000);

      console.log('[VOICE] Response status:', result.status);
      if (result.status !== 200) {
        lastError = `HTTP ${result.status}`;
        continue;
      }

      const text = result.text;
      const lines = text.split('\n');
      let transcription = '';
      let answer = '';
      let cached = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.error) {
            console.log('[VOICE] Backend error:', parsed.error);
            if (onError) onError(parsed.error);
            return;
          }
          if (parsed.transcription && !transcription) {
            console.log('[VOICE] Transcription received:', parsed.transcription);
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
            console.log('[VOICE] Stream complete, answer length:', answer.length);
            if (onComplete) onComplete(answer, transcription, cached);
            return;
          }
        } catch {
          continue;
        }
      }

      return;
    } catch (err) {
      console.log('[VOICE] Request failed for', url, ':', err);
      lastError = String(err);
      continue;
    }
  }

  console.log('[VOICE] All stream URLs failed, trying fallback voiceChat');
  const fallback = await voiceChat(audioUri, grade, subject);
  if (fallback) {
    console.log('[VOICE] Fallback succeeded:', fallback.answer.slice(0, 50));
    if (onComplete) onComplete(fallback.answer, fallback.transcription, false);
    return;
  }

  console.log('[VOICE] All methods failed, lastError:', lastError);
  if (onError) onError(lastError || 'Voice chat failed');
}

import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';

/**
 * Voice Logger — "Audio to Log"
 *
 * Transcribes audio via OpenAI Whisper, then enriches the prompt
 * so the lifeCreditLogger can process it as a normal activity log.
 *
 * Chain: voiceLogger → lifeCreditLogger → reflectionCoach
 */

interface WhisperTranscription {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe base64-encoded audio using OpenAI Whisper API.
 */
async function transcribeAudio(audioBase64: string): Promise<WhisperTranscription> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for audio transcription');
  }

  // Decode base64 to buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');

  // Create form data for Whisper API
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });
  formData.append('file', blob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${error}`);
  }

  const result = await response.json();

  return {
    text: result.text || '',
    language: result.language,
    duration: result.duration,
  };
}

/**
 * Main LangGraph node for voice logging.
 *
 * Expects state.metadata.audioBase64 to contain the base64-encoded audio.
 * Transcribes → enriches prompt → passes to lifeCreditLogger chain.
 */
export async function voiceLogger(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default;

  const audioBase64 = state.metadata?.audioBase64 as string | undefined;

  if (!audioBase64) {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        voiceLogger: { error: 'No audio provided' },
      },
    };
  }

  let transcription: WhisperTranscription;
  try {
    transcription = await transcribeAudio(audioBase64);
  } catch (err) {
    console.error('[VoiceLogger] Transcription failed:', err);
    return {
      ...state,
      responseContent: "I had trouble understanding that recording. Could you try again or type what you'd like to log?",
      metadata: {
        ...state.metadata,
        voiceLogger: { error: err instanceof Error ? err.message : 'Transcription failed' },
      },
    };
  }

  if (!transcription.text.trim()) {
    return {
      ...state,
      responseContent: "I couldn't hear anything in that recording. Could you try again?",
      metadata: {
        ...state.metadata,
        voiceLogger: { error: 'Empty transcription' },
      },
    };
  }

  // Use LLM to clean up and contextualize the transcription
  const { text: enrichedText } = await generateText({
    model: getModel(modelId),
    maxOutputTokens: 200,
    temperature: 0,
    prompt: `A student recorded a voice memo describing an activity they did. Clean up the transcription into a clear first-person statement suitable for logging as a learning activity. Keep it natural and preserve all details.

Raw transcription: "${transcription.text}"

Return ONLY the cleaned-up statement (e.g. "I baked sourdough bread and measured the ingredients using fractions"):`,
  });

  const cleanedPrompt = enrichedText.trim() || transcription.text;

  // Build response showing what was heard
  const durationNote = transcription.duration
    ? ` (${Math.round(transcription.duration)}s recording)`
    : '';

  const responseContent = `🎙️ I heard you say: "${cleanedPrompt}"${durationNote}

Let me log that for you...`;

  return {
    ...state,
    prompt: cleanedPrompt,
    responseContent,
    metadata: {
      ...state.metadata,
      voiceLogger: {
        originalTranscription: transcription.text,
        cleanedPrompt,
        language: transcription.language,
        duration: transcription.duration,
      },
    },
  };
}

import { generateText } from 'ai';
import { loadConfig } from '../config';
import { AdelineGraphState } from './types';
import { getModel } from '../ai-models';

/**
 * Generates an analogy to bridge a difficult concept to a student's interests.
 * This tool is invoked when the student's cognitive load is high.
 */
export async function generateAnalogy(state: AdelineGraphState): Promise<AdelineGraphState> {
  const config = loadConfig();
  const modelId = config.models.default;

  // Extract the core concept from the prompt. This is a simplified approach.
  // In a more advanced implementation, you might use NLP to extract the key topic.
  const concept = state.prompt.split(' ').slice(-3).join(' '); // A naive way to guess the concept

  const interests = state.studentContext?.interests || [];

  if (!concept || interests.length === 0) {
    return {
      ...state,
      responseContent: "I'm here to help! It seems like you're finding this topic a bit tricky. Can you tell me more about what you're working on?",
    };
  }

  try {
    const { text } = await generateText({
      model: getModel(modelId),
      temperature: 0.7,
      maxOutputTokens: 300,
      prompt: `You are Adeline, a warm and creative learning companion. A student is struggling with a concept and needs an analogy to understand it better.

The difficult concept is: "${concept}"
The student's interests are: ${interests.join(', ')}

Your task:
1. Create a simple, powerful analogy that connects "${concept}" to one of the student's interests.
2. The analogy should be easy to understand and remember.
3. It should be encouraging and positive in tone.
4. Do not use complex jargon.

Return ONLY the analogy text, nothing else.`,
    });

    const analogy = text.trim();

    const genUIPayload = {
      component: 'AnalogyCard',
      props: {
        concept,
        analogy,
        interests,
      },
    };

    return {
      ...state,
      responseContent: null, // The response is now handled by a GenUI component
      genUIPayload,
      metadata: {
        ...state.metadata,
        generateAnalogy: { concept, analogy },
      },
    };
  } catch (err) {
    console.error('[generateAnalogy] Failed to generate analogy:', err);
    return {
      ...state,
      responseContent: "I'm having trouble coming up with an analogy right now, but I'm here to help. Can you try asking your question in a different way?",
      metadata: {
        ...state.metadata,
        errors: [...(state.metadata?.errors || []), 'generateAnalogy failed'],
      },
    };
  }
}

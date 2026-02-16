'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { AdelineTyping } from '@/components/chat/AdelineTyping';
import { GenUIRenderer } from '@/components/gen-ui/GenUIRenderer';

const SUGGESTED_PROMPTS = [
  { text: "I baked sourdough bread today", intent: "LIFE_LOG", icon: "🍞" },
  { text: "Who really profits from standardized testing?", intent: "INVESTIGATE", icon: "🔍" },
  { text: "I want to build a chicken coop", intent: "BRAINSTORM", icon: "🛠️" },
  { text: "Help me reflect on what I learned this week", intent: "REFLECT", icon: "💭" },
];

function getMessageText(message: { content?: string; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === 'string' && message.content.length > 0) {
    return message.content;
  }
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

export default function PlaygroundPage() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    id: 'playground',
  });
  const [genUIPayload, setGenUIPayload] = useState<any>(null);

  const latestMeta = (() => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant');
    return (last as any)?.metadata;
  })();

  if (latestMeta?.genUIPayload && latestMeta.genUIPayload !== genUIPayload) {
    setGenUIPayload(latestMeta.genUIPayload);
  }

  const handlePromptClick = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      const form = document.querySelector('#playground-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFEF7',
      padding: 24,
      fontFamily: 'Kalam, "Comic Sans MS", system-ui',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: '"Emilys Candy", cursive',
            color: '#2F4731',
            fontSize: '3rem',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Try Adeline
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center', color: '#4B3424', marginBottom: 32 }}
        >
          No login required. Click a suggestion or ask your own question!
        </motion.p>

        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <motion.button
              key={prompt.text}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePromptClick(prompt.text)}
              style={{
                background: '#FFFFFF',
                border: '2px solid #E7DAC3',
                borderRadius: 999,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontFamily: 'Kalam, "Comic Sans MS", system-ui',
              }}
            >
              <span style={{ fontSize: 24 }}>{prompt.icon}</span>
              <span style={{ color: '#2F4731' }}>{prompt.text}</span>
            </motion.button>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 16,
                padding: 16,
                background: m.role === 'user' ? '#2F4731' : '#FFFFFF',
                color: m.role === 'user' ? '#FFF' : '#121B13',
                borderRadius: m.role === 'user' ? '14px 0 14px 14px' : '0 14px 14px 14px',
                border: '1px solid #E7DAC3',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              }}
            >
              {getMessageText(m)}
            </motion.div>
          ))}

          {genUIPayload && <GenUIRenderer payload={genUIPayload} />}

          {isLoading && <AdelineTyping />}
        </div>

        <form id="playground-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Adeline anything..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #E7DAC3',
              fontSize: 16,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#BD6809',
              color: '#FFF',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              fontFamily: 'Kalam, "Comic Sans MS", system-ui',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

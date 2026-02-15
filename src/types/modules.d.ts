declare module '@react-pdf/renderer' {
  import * as React from 'react';
  export interface Style {
    [key: string]: string | number | Style | undefined;
  }
  export const StyleSheet: { create: (styles: Record<string, Style>) => Record<string, Style> };
  export const Document: React.ComponentType<any>;
  export const Page: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const View: React.ComponentType<any>;
  export const pdf: (doc: React.ReactElement) => { toBuffer(): Promise<Buffer> };
}

declare module '@supabase/ssr' {
  import type { SupabaseClientOptions, SupabaseClient } from '@supabase/supabase-js';
  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<'public'> & {
      cookies?: { get(name: string): string | undefined; set?(...args: any[]): void; remove?(...args: any[]): void };
      headers?: any;
    },
  ): SupabaseClient<'public'>;
}

declare module 'ai/server' {
  export class StreamData<T = any> {
    append(value: T): void;
    close(): void;
  }
}

declare module 'ai/react' {
  export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
  export interface UseChatOptions {
    api?: string;
    id?: string;
    initialMessages?: ChatMessage[];
  }
  export interface UseChatHelpers {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    data?: unknown;
    handleInputChange: (e: any) => void;
    handleSubmit: (e: any) => void;
    setInput: (v: string) => void;
    append: (msg: ChatMessage) => void;
  }
  export function useChat(options?: UseChatOptions): UseChatHelpers;
}

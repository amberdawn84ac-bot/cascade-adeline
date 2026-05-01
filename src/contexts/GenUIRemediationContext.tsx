'use client';

import React, { createContext, useContext, useCallback, useRef } from 'react';

/**
 * Remediation request types that components can dispatch.
 * These trigger immediate UI updates via the active chat stream.
 */
export type RemediationRequest =
  | { type: 'student_stuck'; componentType: string; componentId: string; failedAttempts: number; concept?: string }
  | { type: 'hint_needed'; componentType: string; componentId: string; hintLevel: number }
  | { type: 'scaffold_requested'; componentType: string; componentId: string }
  | { type: 'concept_confused'; componentType: string; componentId: string; misconception: string };

interface GenUIRemediationContextValue {
  /**
   * Request immediate remediation via the active chat stream.
   * This triggers LangGraph to stream down a new GenUI component.
   */
  requestRemediation: (request: RemediationRequest) => void;
  
  /**
   * Register the addToolResult function from useChat.
   * Called by FloatingBeeBubble when it mounts.
   */
  registerToolResultHandler: (handler: (toolCallId: string, result: unknown) => void) => void;
  
  /**
   * Register the append function from useChat for injecting messages.
   */
  registerAppendHandler: (handler: (message: { role: 'user'; content: string }) => void) => void;
}

const GenUIRemediationContext = createContext<GenUIRemediationContextValue | null>(null);

export function GenUIRemediationProvider({ children }: { children: React.ReactNode }) {
  const toolResultHandlerRef = useRef<((toolCallId: string, result: unknown) => void) | null>(null);
  const appendHandlerRef = useRef<((message: { role: 'user'; content: string }) => void) | null>(null);
  const pendingRemediationRef = useRef<RemediationRequest | null>(null);

  const registerToolResultHandler = useCallback(
    (handler: (toolCallId: string, result: unknown) => void) => {
      toolResultHandlerRef.current = handler;
    },
    []
  );

  const registerAppendHandler = useCallback(
    (handler: (message: { role: 'user'; content: string }) => void) => {
      appendHandlerRef.current = handler;
      
      // If there's a pending remediation, process it now
      if (pendingRemediationRef.current) {
        const request = pendingRemediationRef.current;
        pendingRemediationRef.current = null;
        processRemediation(request, handler);
      }
    },
    []
  );

  const processRemediation = (
    request: RemediationRequest,
    append: (message: { role: 'user'; content: string }) => void
  ) => {
    // Convert remediation request to a hidden user message that triggers LangGraph
    // The message is prefixed with [REMEDIATION] so the router can detect it
    const remediationMessage = buildRemediationMessage(request);
    
    console.log('[GenUIRemediation] Dispatching remediation:', request.type, remediationMessage);
    
    // Inject as a user message — LangGraph will process and stream back a GenUI component
    append({
      role: 'user',
      content: remediationMessage,
    });
  };

  const requestRemediation = useCallback((request: RemediationRequest) => {
    console.log('[GenUIRemediation] Remediation requested:', request);
    
    if (appendHandlerRef.current) {
      processRemediation(request, appendHandlerRef.current);
    } else {
      // Queue for when handler is registered
      console.warn('[GenUIRemediation] No append handler registered, queuing request');
      pendingRemediationRef.current = request;
    }
  }, []);

  return (
    <GenUIRemediationContext.Provider
      value={{
        requestRemediation,
        registerToolResultHandler,
        registerAppendHandler,
      }}
    >
      {children}
    </GenUIRemediationContext.Provider>
  );
}

export function useGenUIRemediation() {
  const context = useContext(GenUIRemediationContext);
  if (!context) {
    throw new Error('useGenUIRemediation must be used within GenUIRemediationProvider');
  }
  return context;
}

/**
 * Build a hidden remediation message that LangGraph can parse.
 * Format: [REMEDIATION:type] context
 */
function buildRemediationMessage(request: RemediationRequest): string {
  switch (request.type) {
    case 'student_stuck':
      return `[REMEDIATION:STUCK] I'm struggling with this ${request.componentType}. I've tried ${request.failedAttempts} times${request.concept ? ` on the concept "${request.concept}"` : ''}. Can you help me understand this differently?`;
    
    case 'hint_needed':
      return `[REMEDIATION:HINT] I need a hint for this ${request.componentType}. This is hint level ${request.hintLevel}.`;
    
    case 'scaffold_requested':
      return `[REMEDIATION:SCAFFOLD] This ${request.componentType} is too hard. Can you break it down into smaller steps?`;
    
    case 'concept_confused':
      return `[REMEDIATION:MISCONCEPTION] I think I have a misconception about this ${request.componentType}: "${request.misconception}". Can you clarify?`;
    
    default:
      return `[REMEDIATION:GENERAL] I need help with this component.`;
  }
}

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-confetti
vi.mock('react-confetti', () => ({
  default: () => <canvas data-testid="confetti" />,
}));

// Mock GenUI components
vi.mock('@/components/gen-ui/index', () => ({
  TranscriptCard: ({ credits }: any) => (
    <div data-testid="transcript-card">Credits: {JSON.stringify(credits)}</div>
  ),
  InvestigationBoard: ({ topic }: any) => (
    <div data-testid="investigation-board">Topic: {topic}</div>
  ),
  ProjectImpactCard: () => <div data-testid="project-card">Project</div>,
  MissionBriefing: () => <div data-testid="mission-briefing">Mission</div>,
}));

import { GenUIRenderer } from '@/components/gen-ui/GenUIRenderer';

describe('GenUIRenderer', () => {
  it('renders nothing when payload is null', () => {
    const { container } = render(<GenUIRenderer payload={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders TranscriptCard for transcript payload', () => {
    const payload = {
      component: 'TranscriptCard',
      props: { credits: '1.0 Chemistry' },
    };

    render(<GenUIRenderer payload={payload} />);
    expect(screen.getByTestId('transcript-card')).toBeInTheDocument();
  });

  it('shows confetti for TranscriptCard', async () => {
    const payload = {
      component: 'TranscriptCard',
      props: { credits: '0.5 Math' },
    };

    render(<GenUIRenderer payload={payload} />);

    await waitFor(() => {
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });
  });

  it('renders InvestigationBoard for investigation payload', () => {
    const payload = {
      component: 'InvestigationBoard',
      props: { topic: 'Common Core Funding' },
    };

    render(<GenUIRenderer payload={payload} />);
    expect(screen.getByTestId('investigation-board')).toBeInTheDocument();
    expect(screen.getByText(/Topic: Common Core/)).toBeInTheDocument();
  });

  it('renders ProjectImpactCard', () => {
    const payload = {
      component: 'ProjectImpactCard',
      props: {},
    };

    render(<GenUIRenderer payload={payload} />);
    expect(screen.getByTestId('project-card')).toBeInTheDocument();
  });

  it('renders MissionBriefing', () => {
    const payload = {
      component: 'MissionBriefing',
      props: {},
    };

    render(<GenUIRenderer payload={payload} />);
    expect(screen.getByTestId('mission-briefing')).toBeInTheDocument();
  });

  it('logs warning for unknown component type', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const payload = {
      component: 'UnknownComponent',
      props: {},
    };

    const { container } = render(<GenUIRenderer payload={payload} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown GenUI component type')
    );

    consoleSpy.mockRestore();
  });
});

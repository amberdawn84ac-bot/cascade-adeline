'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TourStep {
  title: string;
  description: string;
  illustration: string;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Dear Adeline! 🎉',
    description: 'I\'m Adeline, your AI learning guide. I\'m here to help you discover what you love, build real skills, and earn high school credits along the way. This quick tour will show you how everything works.',
    illustration: '🏔️',
    highlight: 'Let\'s get started!'
  },
  {
    title: 'The 8 Integrated Tracks',
    description: 'Instead of boring subjects, you learn through 8 real-world tracks:\n\n1. God\'s Creation Science\n2. Truth-Based History\n3. Mathematical Thinking\n4. Literary Arts\n5. Domestic Arts\n6. Health & Naturopathy\n7. Trades & Entrepreneurship\n8. Civic Engagement & Justice\n\nMost projects touch multiple tracks at once — just like real life!',
    illustration: '🌿',
    highlight: 'Cross-curricular learning'
  },
  {
    title: 'Credits & Graduation Ascent',
    description: 'Every activity you complete earns you high school credits. Your journey page shows your progress toward graduation — it\'s like climbing a mountain, one step at a time.\n\nNo busywork. No fake assignments. Everything you do matters.',
    illustration: '⛰️',
    highlight: 'Real credits for real work'
  },
  {
    title: 'Your Journey Page',
    description: 'This is your home base. You\'ll see:\n\n• Active Expeditions (courses you\'re working on)\n• The Trail Ahead (your next courses)\n• Daily Bread (scripture study)\n• Your progress to graduation\n\nClick any course card to get today\'s lesson!',
    illustration: '🗺️',
    highlight: 'One clean entry point'
  },
  {
    title: 'Chat with Me Anytime',
    description: 'I\'m always here to help! You can:\n\n• Log activities ("I baked bread today")\n• Ask questions about any subject\n• Get project ideas\n• Investigate historical sources\n• Reflect on what you\'re learning\n\nJust talk to me like a real person.',
    illustration: '💬',
    highlight: 'Your AI learning partner'
  },
  {
    title: 'Ready to Start?',
    description: 'That\'s it! You\'re ready to begin your learning journey. Remember:\n\n✅ Every project must serve someone or solve something real\n✅ No busywork allowed\n✅ You\'re building skills that matter\n\nLet\'s go make something amazing! 🚀',
    illustration: '🎯',
    highlight: 'Time to explore!'
  }
];

export function GuidedTourModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem('adeline_tour_completed');
    if (!tourCompleted) {
      // Delay opening to let the page load
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('adeline_tour_completed', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="relative max-w-2xl w-full border-2 border-[#BD6809] bg-[#FFFEF7] shadow-2xl">
        <CardContent className="p-8">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-[#2F4731]/40 hover:text-[#2F4731] transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-[#BD6809]'
                    : index < currentStep
                    ? 'w-2 bg-[#2F4731]'
                    : 'w-2 bg-[#E7DAC3]'
                }`}
              />
            ))}
          </div>

          {/* Illustration */}
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">{step.illustration}</div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 
              className="text-3xl font-bold text-[#2F4731] mb-4" 
              style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
            >
              {step.title}
            </h2>
            <p className="text-[#2F4731] leading-relaxed whitespace-pre-line text-lg mb-4">
              {step.description}
            </p>
            {step.highlight && (
              <div className="inline-block px-4 py-2 bg-[#BD6809]/10 border border-[#BD6809] rounded-full">
                <span className="text-[#BD6809] font-bold text-sm">
                  {step.highlight}
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              variant="outline"
              className="border-[#E7DAC3] text-[#2F4731] hover:bg-[#E7DAC3] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="text-sm text-[#2F4731]/60">
              {currentStep + 1} of {TOUR_STEPS.length}
            </div>

            <Button
              onClick={handleNext}
              className="bg-[#BD6809] text-white hover:bg-[#2F4731] transition-colors"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Let's Go!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip link */}
          {!isLastStep && (
            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-[#2F4731]/50 hover:text-[#2F4731] underline"
              >
                Skip tour
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, GraduationCap, Users, User, Loader2, Mail } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

type Role = 'student' | 'parent' | 'teacher';
type Mode = 'login' | 'signup';
type LoginStep = 'role' | 'email' | 'password';
type SignupStep = 'role' | 'name-email' | 'password' | 'confirm-email';

const ROLE_LABELS: Record<Role, { title: string; subtitle: string; icon: typeof User }> = {
  student: { title: "I'm a Student", subtitle: 'Ready to learn something new', icon: User },
  parent:  { title: "I'm a Parent",  subtitle: 'Checking progress & settings', icon: Users },
  teacher: { title: "I'm a Teacher", subtitle: 'Managing curriculum', icon: GraduationCap },
};

export function ConversationalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [mode, setMode] = useState<Mode>('login');
  const [loginStep, setLoginStep] = useState<LoginStep>('role');
  const [signupStep, setSignupStep] = useState<SignupStep>('role');

  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError(null);
    setLoginStep('role');
    setSignupStep('role');
    setRole(null);
    setName('');
    setEmail('');
    setPassword('');
  }

  // ── LOGIN FLOW ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.refresh();
      router.push(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email first, then click Forgot Password.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setError('Password reset email sent! Check your inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP FLOW ──────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('Signup returned no user');

      // Provision Prisma User record
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, name: name.trim(), role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Failed to create user profile');
      }

      if (data.session) {
        // Auto-confirm enabled (local dev) — go straight to onboarding
        router.refresh();
        router.push('/onboarding');
      } else {
        // Email confirmation required
        setSignupStep('confirm-email');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setLoading(false);
    }
  };

  // ── RENDER HELPERS ──────────────────────────────────────────
  const RoleButtons = ({ onSelect }: { onSelect: (r: Role) => void }) => (
    <div className="space-y-3">
      {(Object.entries(ROLE_LABELS) as [Role, typeof ROLE_LABELS[Role]][]).map(([key, { title, subtitle, icon: Icon }]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="w-full p-4 rounded-xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:bg-[#FFF3E7] transition-all flex items-center gap-4 group text-left"
        >
          <div className="p-3 bg-[#E7DAC3]/30 rounded-full text-[#BD6809] group-hover:bg-[#BD6809] group-hover:text-white transition-colors">
            <Icon size={24} />
          </div>
          <div>
            <div className="font-bold text-[#2F4731]">{title}</div>
            <div className="text-sm text-[#2F4731]/60">{subtitle}</div>
          </div>
        </button>
      ))}
    </div>
  );

  const inputClass = "w-full p-4 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5] text-lg";
  const backBtn = (onClick: () => void) => (
    <button type="button" onClick={onClick} className="text-[#2F4731]/60 hover:text-[#2F4731] text-sm font-bold">
      Back
    </button>
  );
  const nextBtn = (label = 'Next') => (
    <button type="submit" className="bg-[#BD6809] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A05808] transition-colors flex items-center gap-2">
      {label} <ArrowRight size={20} />
    </button>
  );
  const submitBtn = (label: string) => (
    <button type="submit" disabled={loading} className="flex-1 bg-[#2F4731] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1E2E20] transition-colors disabled:opacity-50">
      {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : label}
    </button>
  );

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Welcome to Adeline
        </h1>
        <p className="text-[#BD6809] font-medium">Your personalized learning companion</p>
      </div>

      {/* Mode toggle */}
      <div className="flex mb-6 bg-[#F5EFE0] rounded-2xl p-1">
        {(['login', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${mode === m ? 'bg-white text-[#2F4731] shadow-sm' : 'text-[#2F4731]/50'}`}
          >
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#E7DAC3] relative overflow-hidden min-h-[380px] flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* ── LOGIN STEPS ── */}
          {mode === 'login' && loginStep === 'role' && (
            <motion.div key="login-role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Who is visiting today?</h2>
              <RoleButtons onSelect={(r) => { setRole(r); setLoginStep('email'); }} />
            </motion.div>
          )}

          {mode === 'login' && loginStep === 'email' && (
            <motion.div key="login-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>What&apos;s your email?</h2>
              <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setLoginStep('password'); }} className="space-y-6">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={`${inputClass} text-center`} autoFocus required />
                <div className="flex justify-between items-center">{backBtn(() => setLoginStep('role'))}{nextBtn()}</div>
              </form>
            </motion.div>
          )}

          {mode === 'login' && loginStep === 'password' && (
            <motion.div key="login-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Your secret key?</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} text-center`} autoFocus required />
                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="flex justify-between items-center">
                  {backBtn(() => setLoginStep('email'))}
                  {submitBtn('Sign In')}
                </div>
                <div className="text-center">
                  <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-[#BD6809] text-sm hover:underline disabled:opacity-50">
                    Forgot password?
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── SIGNUP STEPS ── */}
          {mode === 'signup' && signupStep === 'role' && (
            <motion.div key="signup-role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>I am a...</h2>
              <RoleButtons onSelect={(r) => { setRole(r); setSignupStep('name-email'); }} />
            </motion.div>
          )}

          {mode === 'signup' && signupStep === 'name-email' && (
            <motion.div key="signup-name-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Tell me about you</h2>
              <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && email.trim()) setSignupStep('password'); }} className="space-y-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" className={inputClass} autoFocus required />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={inputClass} required />
                <div className="flex justify-between items-center">{backBtn(() => setSignupStep('role'))}{nextBtn()}</div>
              </form>
            </motion.div>
          )}

          {mode === 'signup' && signupStep === 'password' && (
            <motion.div key="signup-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Choose a secret key</h2>
              <form onSubmit={handleSignup} className="space-y-4">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={`${inputClass} text-center`} autoFocus required minLength={8} />
                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
                <div className="flex justify-between items-center">
                  {backBtn(() => setSignupStep('name-email'))}
                  {submitBtn('Create Account')}
                </div>
              </form>
            </motion.div>
          )}

          {mode === 'signup' && signupStep === 'confirm-email' && (
            <motion.div key="signup-confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
              <div className="mx-auto w-16 h-16 bg-[#FFF3E7] rounded-full flex items-center justify-center">
                <Mail size={32} className="text-[#BD6809]" />
              </div>
              <h2 className="text-2xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Check your email!</h2>
              <p className="text-[#2F4731]/70 leading-relaxed">
                We sent a confirmation link to <span className="font-bold text-[#BD6809]">{email}</span>. Click it to activate your account, then come back here to sign in.
              </p>
              <button onClick={() => switchMode('login')} className="text-[#BD6809] font-bold hover:underline text-sm">
                Back to Sign In
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

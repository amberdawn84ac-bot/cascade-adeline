"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, GraduationCap, Users, User, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export function ConversationalLogin() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'email' | 'password'>('role');
  const [role, setRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleRoleSelect = (selectedRole: 'student' | 'parent' | 'teacher') => {
    setRole(selectedRole);
    setStep('email');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // For now, assume auto-confirm. In production, show message to check email.
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#2F4731] mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          Welcome to Adeline
        </h1>
        <p className="text-[#BD6809] font-medium">Your personalized learning companion</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#E7DAC3] relative overflow-hidden min-h-[400px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Who is visiting today?
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('student')}
                  className="w-full p-4 rounded-xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:bg-[#FFF3E7] transition-all flex items-center gap-4 group text-left"
                >
                  <div className="p-3 bg-[#E7DAC3]/30 rounded-full text-[#BD6809] group-hover:bg-[#BD6809] group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-[#2F4731]">I'm a Student</div>
                    <div className="text-sm text-[#2F4731]/60">Ready to learn something new</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('parent')}
                  className="w-full p-4 rounded-xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:bg-[#FFF3E7] transition-all flex items-center gap-4 group text-left"
                >
                  <div className="p-3 bg-[#E7DAC3]/30 rounded-full text-[#BD6809] group-hover:bg-[#BD6809] group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-[#2F4731]">I'm a Parent</div>
                    <div className="text-sm text-[#2F4731]/60">Checking progress & settings</div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect('teacher')}
                  className="w-full p-4 rounded-xl border-2 border-[#E7DAC3] hover:border-[#BD6809] hover:bg-[#FFF3E7] transition-all flex items-center gap-4 group text-left"
                >
                  <div className="p-3 bg-[#E7DAC3]/30 rounded-full text-[#BD6809] group-hover:bg-[#BD6809] group-hover:text-white transition-colors">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-[#2F4731]">I'm a Teacher</div>
                    <div className="text-sm text-[#2F4731]/60">Managing curriculum</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Hello, {role}! <br/> What's your email?
              </h2>
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-4 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5] text-lg text-center"
                  autoFocus
                  required
                />
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep('role')}
                    className="text-[#2F4731]/60 hover:text-[#2F4731] text-sm font-bold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="bg-[#BD6809] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A05808] transition-colors flex items-center gap-2"
                  >
                    Next <ArrowRight size={20} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold text-[#2F4731] text-center mb-6" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                And your secret key?
              </h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5] text-lg text-center"
                    autoFocus
                    required
                  />
                  {error && (
                    <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg">
                      {error}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className="flex-1 bg-[#E7DAC3] text-[#2F4731] px-6 py-3 rounded-xl font-bold hover:bg-[#D4C3A3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sign Up'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#2F4731] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1E2E20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Sign In'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

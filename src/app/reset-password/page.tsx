"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createBrowserClient = (require('@supabase/ssr') as { createBrowserClient: typeof createServerClient }).createBrowserClient;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setIsError(true);
      setMessage('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setIsError(false);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setMessage('Password updated! Redirecting to dashboard…');
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setLoading(false);
  };

  const inputClass =
    'w-full p-4 rounded-xl border-2 border-[#E7DAC3] focus:border-[#BD6809] outline-none bg-[#FFFDF5] text-lg';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFEF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#FFF3E7] rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-[#BD6809]" />
          </div>
          <h1
            className="text-3xl font-bold text-[#2F4731]"
            style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
          >
            Choose a New Password
          </h1>
          <p className="text-[#2F4731]/60 mt-2">At least 8 characters.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#E7DAC3] space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className={inputClass}
            required
            minLength={8}
            autoFocus
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className={inputClass}
            required
            minLength={8}
          />

          {message && (
            <p
              className={`text-sm font-bold text-center p-2 rounded-lg ${
                isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BD6809] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#A05808] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

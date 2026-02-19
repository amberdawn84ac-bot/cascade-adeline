import { Suspense } from 'react';
import { ConversationalLogin } from '@/components/auth/ConversationalLogin';
import { WheatStalk } from '@/components/illustrations';

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFEF7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        color: '#121B13',
        padding: '2rem',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(189, 104, 9, 0.05) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(47, 71, 49, 0.05) 0%, transparent 20%)',
      }}
    >
      <div className="absolute top-8 left-8 opacity-20 rotate-[-15deg]">
        <WheatStalk size={120} color="#BD6809" />
      </div>
      <div className="absolute bottom-8 right-8 opacity-20 rotate-[165deg]">
        <WheatStalk size={120} color="#2F4731" />
      </div>

      <Suspense fallback={<div className="w-full max-w-md mx-auto p-6 text-center text-[#2F4731]/60">Loading...</div>}>
        <ConversationalLogin />
      </Suspense>
    </div>
  );
}

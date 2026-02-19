import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFEF7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <div className="w-full max-w-xl text-center space-y-8">
        <div className="text-8xl">🎉</div>

        <div className="space-y-4">
          <h1
            className="text-5xl font-bold text-[#2F4731]"
            style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
          >
            Welcome to the Academy!
          </h1>
          <p className="text-xl text-[#2F4731]/70 leading-relaxed">
            Your subscription is active. Adeline is ready to help your student learn, grow, and thrive.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-[#E7DAC3] p-8 shadow-lg space-y-4">
          <p className="text-[#BD6809] font-bold text-sm uppercase tracking-widest">
            What&apos;s next?
          </p>
          <ul className="text-left space-y-3 text-[#2F4731]">
            <li className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <span>Chat with Adeline — tell her what your student loves to explore.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">🏠</span>
              <span>Visit the Dashboard to see your learning rooms and track progress.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">⚙️</span>
              <span>Set up your grade level and interests in Settings.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-10 py-4 rounded-full bg-[#2F4731] text-white font-black uppercase tracking-widest text-sm hover:bg-[#1E2E20] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/chat"
            className="px-10 py-4 rounded-full border-2 border-[#BD6809] text-[#BD6809] font-black uppercase tracking-widest text-sm hover:bg-[#BD6809] hover:text-white transition-colors"
          >
            Chat with Adeline
          </Link>
        </div>
      </div>
    </div>
  );
}

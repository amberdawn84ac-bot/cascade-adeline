import Link from 'next/link';
import {
  WheatStalk,
  OpenBook,
  Compass,
  Scroll,
  Pencil,
  MagnifyingGlass,
  Lightbulb,
} from '@/components/illustrations';

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

type Feature = {
  title: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
};

const FEATURES: Feature[] = [
  { title: 'Student-Led Learning', description: 'Adeline follows curiosities and builds plans around passions.', Icon: OpenBook },
  { title: 'Skills & Credits Tracking', description: 'Every activity maps to credits and competencies automatically.', Icon: Compass },
  { title: 'Graduation Tracker', description: 'See progress toward state-aligned graduation goals in one glance.', Icon: Scroll },
  { title: 'Portfolio Builder', description: 'Projects, artifacts, and reflections all saved for transcripts.', Icon: Pencil },
  { title: 'Gap Detection', description: 'Adeline spots missing concepts early and suggests just-right nudges.', Icon: MagnifyingGlass },
  { title: 'Fun & Games', description: 'Playful missions, badges, and creative prompts keep learners engaged.', Icon: Lightbulb },
];

function Button({ href, filled, children }: { href: string; filled?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '12px 18px',
        borderRadius: 14,
        border: filled ? 'none' : `1px solid ${PALM}`,
        background: filled ? PAPAYA : '#FFFFFF',
        color: filled ? '#FFFFFF' : PALM,
        fontWeight: 700,
        boxShadow: filled ? '0 8px 18px rgba(189,104,9,0.28)' : 'none',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </Link>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const { title, description, Icon } = feature;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid #E7DAC3`,
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={28} color={PALM} />
        <h3 style={{ fontFamily: '"Kranky", "Comic Sans MS", system-ui', color: PALM, fontSize: '1.1rem', margin: 0 }}>{title}</h3>
      </div>
      <p style={{ marginTop: 10, marginBottom: 0, color: '#4B3424', lineHeight: 1.6, fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>
        {description}
      </p>
    </div>
  );
}

function NavBar() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255,255,255,0.7)',
        borderBottom: '1px solid #E7DAC3',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <WheatStalk size={32} color={PAPAYA} />
        <span style={{ fontFamily: 'var(--font-emilys-candy), "Emilys Candy", cursive', color: PALM, fontSize: '1.4rem' }}>Dear Adeline</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button href="/login">Log In</Button>
        <Button href="/chat" filled>
          Join the Academy
        </Button>
      </div>
    </nav>
  );
}

function HeroChatMock() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E7DAC3',
        borderRadius: 18,
        padding: '16px 18px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
        transform: 'rotate(-1.5deg)',
        width: '100%',
        maxWidth: 420,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span role="img" aria-label="brain" style={{ fontSize: 20 }}>
          🧠
        </span>
        <div style={{ fontWeight: 700, color: PALM }}>AI Mentor — Adeline</div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3FB673', boxShadow: '0 0 0 6px rgba(63,182,115,0.15)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ChatBubble align="left" text="Hi Della! What are you excited to learn today?" />
        <ChatBubble align="right" text="I want to grow my crochet business!" user />
        <ChatBubble align="left" text="That's amazing! Do you have a website yet?" />
        <ChatBubble align="right" text="No, not yet..." user />
        <ChatBubble align="left" text="Perfect! Let's build one together!">
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {['Web Design', 'Marketing', 'Entrepreneurship'].map((tag) => (
              <span
                key={tag}
                style={{
                  background: PAPAYA,
                  color: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </ChatBubble>
      </div>

      <div style={{ marginTop: 12, color: '#4B3424', fontSize: 12, fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>
        Skills automatically tracked toward graduation
      </div>
    </div>
  );
}

function ChatBubble({
  text,
  align,
  user,
  children,
}: {
  text: string;
  align: 'left' | 'right';
  user?: boolean;
  children?: React.ReactNode;
}) {
  const isRight = align === 'right';
  return (
    <div style={{ display: 'flex', justifyContent: isRight ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          background: user ? PALM : '#FFFDF5',
          color: user ? '#FFFFFF' : '#121B13',
          padding: '10px 12px',
          borderRadius: user ? '14px 0 14px 14px' : '0 14px 14px 14px',
          border: user ? `1px solid rgba(47,71,49,0.3)` : '1px solid #E7DAC3',
          maxWidth: '80%',
          boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        }}
      >
        <div>{text}</div>
        {children}
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        alignItems: 'center',
        padding: '120px 24px 60px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: PAPAYA, fontFamily: 'Kalam, "Comic Sans MS", system-ui', fontSize: '1.1rem' }}>
          Where Learning Comes Alive
        </div>
        <div style={{ fontFamily: 'var(--font-emilys-candy), "Emilys Candy", cursive', color: PALM, fontSize: '3.4rem', lineHeight: 1.1 }}>
          Education as <span style={{ color: PAPAYA, fontStyle: 'italic' }}>Unique</span> as Your Child
        </div>
        <p style={{ color: '#4B3424', fontFamily: 'Kalam, "Comic Sans MS", system-ui', lineHeight: 1.7, fontSize: '1.05rem' }}>
          An AI-powered learning companion that adapts to your student's interests, tracks skills toward graduation, and
          transforms curiosity into achievement.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button href="/chat" filled>
            Join the Academy
          </Button>
          <Button href="/login">Learn More</Button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <HeroChatMock />
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section style={{ padding: '40px 24px 60px' }}>
      <div
        style={{
          display: 'grid',
          gap: 18,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section style={{ padding: '20px 24px 60px' }}>
      <div
        style={{
          background: PAPAYA,
          color: '#FFFFFF',
          borderRadius: 20,
          padding: '32px 28px',
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontFamily: '"Emilys Candy", cursive', fontSize: '2.2rem', lineHeight: 1.1 }}>Reclaim Their Wonder</div>
          <p style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', opacity: 0.9, lineHeight: 1.6 }}>
            Join a community of families proving that education is an adventure.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              background: '#FFFFFF',
              color: PAPAYA,
              padding: '12px 16px',
              borderRadius: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
            }}
          >
            Get Started
          </Link>
          <Link
            href="/login"
            style={{
              background: 'transparent',
              color: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: 14,
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.7)',
              textDecoration: 'none',
            }}
          >
            View Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: '16px 24px 24px',
        borderTop: '1px solid #E7DAC3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        background: CREAM,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <WheatStalk size={28} color={PAPAYA} />
        <span style={{ fontFamily: 'var(--font-emilys-candy), "Emilys Candy", cursive', color: PALM, fontSize: '1.2rem' }}>Dear Adeline Academy</span>
      </div>
      <div style={{ color: '#4B3424', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>
        Oklahoma Homeschooling Reimagined · © {new Date().getFullYear()}
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div
      style={{
        background: CREAM,
        minHeight: '100vh',
        color: PALM,
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <NavBar />
      <div style={{ paddingTop: 72 }}>
        <HeroSection />
        <FeaturesSection />
        <CtaBanner />
        <Footer />
      </div>
    </div>
  );
}

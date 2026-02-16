'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const FEATURES = [
  {
    icon: '📝',
    title: 'State-Compliant Transcripts',
    description: 'Automatically generate transcripts from everyday activities. "I baked bread" becomes Chemistry credits.',
  },
  {
    icon: '✝️',
    title: 'Biblical Discernment',
    description: 'Teach critical thinking through a biblical worldview. "Follow the money" investigations build wisdom.',
  },
  {
    icon: '🎯',
    title: 'Interest-Led Learning',
    description: 'Adeline suggests projects in your child\'s Zone of Proximal Development—exactly where they\'re ready to grow.',
  },
  {
    icon: '📁',
    title: 'Portfolio & Artifacts',
    description: 'Build a beautiful portfolio of student work. Photos, documents, and projects—all organized automatically.',
  },
  {
    icon: '📊',
    title: 'Parent Dashboard',
    description: 'Track progress, view insights, and export reports. See exactly what your child is learning.',
  },
  {
    icon: '👥',
    title: 'Learning Clubs',
    description: 'Join subject-based clubs with other homeschool families. Collaborate on projects and share discoveries.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Mom of 4, Texas',
    quote: 'Adeline turned our chaotic homeschool days into organized learning records. I save 10+ hours a week!',
  },
  {
    name: 'Rachel K.',
    role: 'Mom of 2, Virginia',
    quote: 'My kids actually ask to "tell Adeline" about their projects. The transcript cards make learning feel real.',
  },
  {
    name: 'David & Amy L.',
    role: 'Parents of 3, Oregon',
    quote: 'The biblical discernment engine is incredible. Our kids are learning to think critically about everything.',
  },
];

const FAQ = [
  {
    q: 'Is Adeline approved by my state?',
    a: 'Adeline generates transcripts that meet common state requirements. Always check your specific state\'s homeschool laws for compliance details.',
  },
  {
    q: 'How does the Biblical worldview work?',
    a: 'Adeline\'s Discernment Engine teaches "follow the money" critical thinking, helping students evaluate sources and claims through a biblical lens—without being preachy.',
  },
  {
    q: 'Can I export transcripts for college applications?',
    a: 'Yes! Family plan members can export PDF transcripts formatted for college admissions, including credit hours, subjects, and grade levels.',
  },
  {
    q: 'Is my child\'s data safe?',
    a: 'Absolutely. We\'re COPPA-compliant, use PII masking before AI processing, and never sell data. Parents control all data retention settings.',
  },
  {
    q: 'How is this different from a planner?',
    a: 'Planners track what you plan to do. Adeline tracks what your child actually does—and turns it into real academic credits automatically.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: '#FFFEF7', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: '"Emilys Candy", cursive',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: '#2F4731',
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          Turn Everyday Life Into State-Compliant Transcripts with AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontFamily: 'Kalam',
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            color: '#4B3424',
            marginBottom: 40,
            maxWidth: 700,
            margin: '0 auto 40px',
          }}
        >
          Christian homeschool families trust Adeline to track learning,
          build portfolios, and create transcripts—automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => router.push('/playground')}
            style={{
              padding: '16px 40px',
              borderRadius: 16,
              border: 'none',
              background: '#BD6809',
              color: '#FFF',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
              fontFamily: 'Kalam',
            }}
          >
            Try Free — No Credit Card
          </button>
          <button
            onClick={() => router.push('/pricing')}
            style={{
              padding: '16px 40px',
              borderRadius: 16,
              border: '2px solid #2F4731',
              background: 'transparent',
              color: '#2F4731',
              fontWeight: 700,
              fontSize: 18,
              cursor: 'pointer',
              fontFamily: 'Kalam',
            }}
          >
            See Plans
          </button>
        </motion.div>

        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          marginTop: 32,
          flexWrap: 'wrap',
        }}>
          {['1,000+ families', 'Biblical worldview', 'State-compliant'].map((item) => (
            <span key={item} style={{
              fontFamily: 'Kalam',
              color: '#2F4731',
              fontSize: 14,
            }}>
              ✓ {item}
            </span>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section style={{
        padding: '60px 24px',
        background: '#FFFFFF',
        borderTop: '1px solid #E7DAC3',
        borderBottom: '1px solid #E7DAC3',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: '"Emilys Candy", cursive',
            fontSize: '2rem',
            color: '#2F4731',
            marginBottom: 16,
          }}>
            The Homeschool Record-Keeping Problem
          </h2>
          <p style={{
            fontFamily: 'Kalam',
            color: '#4B3424',
            fontSize: '1.1rem',
            marginBottom: 40,
          }}>
            Manual tracking takes hours. Converting real-life learning into transcripts is tedious.
            State compliance is stressful. You didn&apos;t start homeschooling to do paperwork.
          </p>

          <h2 style={{
            fontFamily: '"Emilys Candy", cursive',
            fontSize: '2rem',
            color: '#BD6809',
            marginBottom: 24,
          }}>
            How Adeline Solves It
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
            textAlign: 'left',
          }}>
            {[
              { step: '1', title: 'Log Naturally', desc: '"I baked bread" = Chemistry credit' },
              { step: '2', title: 'Track Automatically', desc: 'Transcripts generate themselves' },
              { step: '3', title: 'Stay Compliant', desc: 'Meet state requirements effortlessly' },
            ].map((item) => (
              <div key={item.step} style={{
                background: '#FFFEF7',
                border: '1px solid #E7DAC3',
                borderRadius: 12,
                padding: 20,
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#BD6809',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  marginBottom: 12,
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontFamily: 'Kranky', color: '#2F4731', marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: 'Kalam', color: '#4B3424', fontSize: 14 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: '"Emilys Candy", cursive',
          fontSize: '2rem',
          color: '#2F4731',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          Everything You Need
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((feature) => (
            <div key={feature.title} style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 16,
              padding: 24,
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{feature.icon}</div>
              <h3 style={{
                fontFamily: 'Kranky',
                color: '#2F4731',
                fontSize: '1.2rem',
                marginBottom: 8,
              }}>
                {feature.title}
              </h3>
              <p style={{ fontFamily: 'Kalam', color: '#4B3424', fontSize: 14 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{
        padding: '60px 24px',
        background: '#FFFFFF',
        borderTop: '1px solid #E7DAC3',
        borderBottom: '1px solid #E7DAC3',
      }}>
        <h2 style={{
          fontFamily: '"Emilys Candy", cursive',
          fontSize: '2rem',
          color: '#2F4731',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          Loved by Homeschool Families
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          maxWidth: 1000,
          margin: '0 auto',
        }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              background: '#FFFEF7',
              border: '1px solid #E7DAC3',
              borderRadius: 16,
              padding: 24,
            }}>
              <p style={{
                fontFamily: 'Kalam',
                color: '#4B3424',
                fontSize: '1rem',
                fontStyle: 'italic',
                marginBottom: 16,
              }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <p style={{ fontWeight: 700, color: '#2F4731' }}>{t.name}</p>
              <p style={{ color: '#4B3424', fontSize: 14 }}>{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '60px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{
          fontFamily: '"Emilys Candy", cursive',
          fontSize: '2rem',
          color: '#2F4731',
          textAlign: 'center',
          marginBottom: 40,
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQ.map((faq) => (
            <details key={faq.q} style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 12,
              padding: '16px 20px',
            }}>
              <summary style={{
                fontFamily: 'Kranky',
                color: '#2F4731',
                fontSize: '1.1rem',
                cursor: 'pointer',
              }}>
                {faq.q}
              </summary>
              <p style={{
                fontFamily: 'Kalam',
                color: '#4B3424',
                marginTop: 12,
                fontSize: 14,
              }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        background: '#2F4731',
      }}>
        <h2 style={{
          fontFamily: '"Emilys Candy", cursive',
          fontSize: '2.5rem',
          color: '#FFFEF7',
          marginBottom: 16,
        }}>
          Ready to Transform Your Homeschool?
        </h2>
        <p style={{
          fontFamily: 'Kalam',
          color: '#E7DAC3',
          fontSize: '1.1rem',
          marginBottom: 32,
        }}>
          Join 1,000+ families who trust Adeline with their learning journey.
        </p>
        <button
          onClick={() => router.push('/playground')}
          style={{
            padding: '16px 48px',
            borderRadius: 16,
            border: 'none',
            background: '#BD6809',
            color: '#FFF',
            fontWeight: 700,
            fontSize: 20,
            cursor: 'pointer',
            fontFamily: 'Kalam',
          }}
        >
          Start Free Today
        </button>
      </section>
    </div>
  );
}

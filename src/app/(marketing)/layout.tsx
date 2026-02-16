import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Homeschool Transcript Builder | Christian Worldview | Dear Adeline',
  description:
    'Turn everyday activities into state-compliant homeschool transcripts. Track learning, build portfolios, and stay organized—all with a Biblical worldview. Try free.',
  keywords: [
    'Christian homeschool AI',
    'homeschool transcript generator',
    'AI homeschool curriculum',
    'interest-led homeschool planning',
    'homeschool learning log',
    'biblical worldview education',
    'homeschool portfolio builder',
    'state compliant homeschool transcript',
  ],
  openGraph: {
    title: 'Dear Adeline — AI Homeschool Transcript Builder',
    description:
      'Turn everyday activities into state-compliant transcripts. Christian homeschool families trust Adeline.',
    type: 'website',
    siteName: 'Dear Adeline',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dear Adeline — AI Homeschool Transcript Builder',
    description:
      'Turn everyday activities into state-compliant transcripts. Try free, no credit card required.',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { 
  Geist, 
  Geist_Mono, 
  Inter
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dear Adeline Academy — Education as Unique as Your Child",
  description: "An AI-powered homeschool learning companion that adapts to your student's interests, tracks skills toward graduation, and transforms curiosity into achievement.",
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Dear Adeline Academy',
    description: 'Oklahoma homeschooling reimagined. AI-powered, student-led, standards-aligned.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

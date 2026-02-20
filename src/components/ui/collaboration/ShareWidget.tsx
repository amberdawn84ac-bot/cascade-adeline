"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Link, Users, Lock } from 'lucide-react';

interface ShareWidgetProps {
  investigationId: string;
  title: string;
}

export function ShareWidget({ investigationId, title }: ShareWidgetProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigationId }),
      });
      const data = await response.json();
      if (data.shareUrl) {
        setShareLink(data.shareUrl);
      }
    } catch (err) {
      console.error('[ShareWidget] Failed to generate link:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 shadow-lg border border-teal-200 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200 rounded-full filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-200 rounded-full filter blur-3xl opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-100 rounded-full text-teal-600 shadow-md">
            <Share2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-teal-800" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              Share Your Investigation
            </h2>
            <p className="text-sm text-teal-600 font-medium">Collaborate with friends</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-teal-200">
          <h3 className="font-bold text-lg text-teal-700 mb-2">{title}</h3>
          <p className="text-gray-700 mb-4">
            Invite friends to explore this investigation with you in real-time. They'll be able to see your board and add their own discoveries.
          </p>

          {!shareLink ? (
            <button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link size={16} />
                  Create Share Link
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border border-teal-200">
                <Lock size={16} className="text-teal-600" />
                <span className="text-sm text-teal-700 font-medium">Secure, time-limited link created</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users size={14} />
          <span>Sharing enables real-time collaboration on this investigation.</span>
        </div>
      </motion.div>
    </div>
  );
}

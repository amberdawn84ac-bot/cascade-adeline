'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingDown, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreditUsage {
  messagesUsed: number;
  messagesLimit: number;
  estimatedCost: number;
  resetTime?: string;
}

export function CreditHeaderWidget() {
  const [usage, setUsage] = useState<CreditUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage/credits');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.warn('[CreditHeaderWidget] Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-[#E7DAC3]">
        <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!usage) return null;

  const percentUsed = (usage.messagesUsed / usage.messagesLimit) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 95;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 ${
        isAtLimit
          ? 'bg-red-50 border-red-400'
          : isNearLimit
          ? 'bg-amber-50 border-amber-400'
          : 'bg-white border-[#E7DAC3]'
      }`}
    >
      {/* Icon */}
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
        isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-amber-100' : 'bg-[#BD6809]/10'
      }`}>
        {isAtLimit ? (
          <AlertCircle className="w-4 h-4 text-red-600" />
        ) : (
          <Coins className={`w-4 h-4 ${isNearLimit ? 'text-amber-600' : 'text-[#BD6809]'}`} />
        )}
      </div>

      {/* Usage info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${
            isAtLimit ? 'text-red-900' : isNearLimit ? 'text-amber-900' : 'text-[#2F4731]'
          }`}>
            {usage.messagesUsed} / {usage.messagesLimit}
          </span>
          <span className="text-xs text-[#2F4731]/60">messages</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentUsed}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-[#BD6809]'
            }`}
          />
        </div>
      </div>

      {/* Cost estimate */}
      {usage.estimatedCost > 0 && (
        <div className="flex items-center gap-1 pl-3 border-l border-[#E7DAC3]">
          <TrendingDown className="w-3 h-3 text-[#2F4731]/60" />
          <span className="text-xs font-mono text-[#2F4731]/80">
            ${usage.estimatedCost.toFixed(2)}
          </span>
        </div>
      )}

      {/* Warning message */}
      {isAtLimit && (
        <span className="text-xs text-red-700 font-medium">
          Limit reached
        </span>
      )}
      {isNearLimit && !isAtLimit && (
        <span className="text-xs text-amber-700 font-medium">
          {usage.messagesLimit - usage.messagesUsed} left
        </span>
      )}
    </motion.div>
  );
}

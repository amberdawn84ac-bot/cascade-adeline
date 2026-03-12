'use client';

import { useState } from 'react';
import { TrendingUp, DollarSign, Calculator, BarChart3, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BusinessResult {
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: string;
  analysis: string;
  advice: string;
  mathBreakdown: string[];
  policyAnalysis?: {
    injusticeDetected: string;
    affectedPopulation: string;
    policyRecommendation: string;
    budgetImpact: string;
  };
}

export default function BusinessMathPage() {
  const [price, setPrice] = useState(1.50);
  const [quantity, setQuantity] = useState(50);
  const [costPerUnit, setCostPerUnit] = useState(0.25);
  const [fixedCosts, setFixedCosts] = useState(5);
  const [businessName, setBusinessName] = useState('Lemonade Stand');
  const [result, setResult] = useState<BusinessResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/math/business/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, quantity, costPerUnit, fixedCosts, businessName }),
      });
      if (!res.ok) throw new Error('Failed');
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsAnalyzing(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/math/business/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, result }),
      });
      if (res.ok) setSaveSuccess(true);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700"><TrendingUp size={32} /></div>
          <div>
            <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>Business Math Lab</h1>
            <p className="text-amber-800/70">Run your virtual business. Adeline will do the real math and explain it.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-[2rem] p-8 border border-amber-100 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800">Your Business</h3>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Business Name</label>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Selling Price per Unit: ${price.toFixed(2)}</label>
              <input type="range" min={0.25} max={10} step={0.25} value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full accent-amber-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Units to Sell: {quantity}</label>
              <input type="range" min={1} max={200} step={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full accent-amber-600" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-amber-800">Your Costs</h3>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Cost per Unit: ${costPerUnit.toFixed(2)}</label>
              <input type="range" min={0} max={5} step={0.05} value={costPerUnit} onChange={e => setCostPerUnit(Number(e.target.value))} className="w-full accent-amber-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-700 mb-1">Fixed Costs (rent, etc.): ${fixedCosts.toFixed(2)}</label>
              <input type="range" min={0} max={50} step={1} value={fixedCosts} onChange={e => setFixedCosts(Number(e.target.value))} className="w-full accent-amber-600" />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full bg-amber-600 hover:bg-amber-700 mt-2">
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating...</> : '📊 Ask Adeline to Analyze'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: `$${result.revenue.toFixed(2)}`, color: 'bg-green-50 border-green-200 text-green-800', icon: <DollarSign size={20} /> },
              { label: 'Costs', value: `$${result.costs.toFixed(2)}`, color: 'bg-red-50 border-red-200 text-red-800', icon: <Calculator size={20} /> },
              { label: 'Profit', value: `$${result.profit.toFixed(2)}`, color: result.profit >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-orange-50 border-orange-200 text-orange-800', icon: <TrendingUp size={20} /> },
              { label: 'Margin', value: result.profitMargin, color: 'bg-blue-50 border-blue-200 text-blue-800', icon: <BarChart3 size={20} /> },
            ].map(stat => (
              <div key={stat.label} className={`p-4 rounded-2xl border ${stat.color} flex items-center gap-3`}>
                {stat.icon}
                <div><p className="text-xs font-bold uppercase tracking-wider opacity-70">{stat.label}</p><p className="text-xl font-bold">{stat.value}</p></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-amber-100 space-y-4">
            <div><h3 className="font-bold text-amber-900 mb-2">Math Breakdown</h3>
              <ul className="space-y-1">{result.mathBreakdown.map((step, i) => <li key={i} className="font-mono text-sm bg-amber-50 px-3 py-1.5 rounded-lg text-amber-800">{step}</li>)}</ul>
            </div>
            <div className="border-t pt-4"><p className="text-slate-700 leading-relaxed">{result.analysis}</p></div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100"><p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Adeline's Advice</p><p className="text-amber-800">{result.advice}</p></div>
            
            {/* Policy Analysis Section */}
            {result.policyAnalysis && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mt-6">
                <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Policy Impact Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Systemic Harm Detected:</p>
                    <p className="text-sm text-red-900 leading-relaxed">{result.policyAnalysis.injusticeDetected}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Who Gets Harmed:</p>
                    <p className="text-sm text-red-900">{result.policyAnalysis.affectedPopulation}</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Policy Recommendation:</p>
                    <p className="text-sm text-red-900 leading-relaxed mb-3">{result.policyAnalysis.policyRecommendation}</p>
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Budget Impact:</p>
                    <p className="text-sm text-red-900 font-mono">{result.policyAnalysis.budgetImpact}</p>
                  </div>
                  <Button 
                    onClick={() => {
                      const letter = `Dear Representative,\n\nI am writing to advocate for policy reform to address ${result.policyAnalysis!.injusticeDetected}.\n\nCurrent Situation:\n${result.policyAnalysis!.affectedPopulation}\n\nProposed Solution:\n${result.policyAnalysis!.policyRecommendation}\n\nBudget Analysis:\n${result.policyAnalysis!.budgetImpact}\n\nI urge you to take action on this issue.\n\nSincerely,\n[Your Name]`;
                      navigator.clipboard.writeText(letter);
                      alert('Policy letter copied to clipboard! Send it to your representative.');
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    📋 Draft Letter to Representative
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button onClick={handleSave} disabled={isSaving || saveSuccess} className="bg-[#2F4731] hover:bg-[#BD6809] text-white px-8 py-5 rounded-2xl">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : saveSuccess ? '✨ Saved to Portfolio!' : '🌿 Save to Portfolio'}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/math" className="text-sm text-amber-600 hover:underline">← Back to Math Hub</Link>
      </div>
    </div>
  );
}


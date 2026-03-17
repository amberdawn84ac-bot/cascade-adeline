'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, DollarSign, AlertTriangle, Calculator, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface TradeDossier {
  tradeName: string;
  hoursToJourneyman: string;
  payScale: {
    apprentice: string;
    journeyman: string;
    master?: string;
  };
  grittyReality: string;
  mathConcept: string;
  physicalDemands: string;
  certifications: string[];
}

// Trade-specific calculator components
function ElectricianCalculator() {
  const [voltage, setVoltage] = useState('');
  const [current, setCurrent] = useState('');
  const [resistance, setResistance] = useState('');

  const calculate = (type: 'voltage' | 'current' | 'resistance') => {
    const v = parseFloat(voltage);
    const i = parseFloat(current);
    const r = parseFloat(resistance);

    if (type === 'voltage' && i && r) {
      setVoltage((i * r).toFixed(2));
    } else if (type === 'current' && v && r) {
      setCurrent((v / r).toFixed(2));
    } else if (type === 'resistance' && v && i) {
      setResistance((v / i).toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-blue-900">⚡ Ohm's Law Calculator</h4>
      <p className="text-xs text-gray-600">V = I × R (Voltage = Current × Resistance)</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Voltage (V)</label>
          <input
            type="number"
            value={voltage}
            onChange={(e) => setVoltage(e.target.value)}
            placeholder="120"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
          <Button onClick={() => calculate('voltage')} size="sm" className="w-full mt-1 text-xs">Calculate V</Button>
        </div>
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Current (A)</label>
          <input
            type="number"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="10"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
          <Button onClick={() => calculate('current')} size="sm" className="w-full mt-1 text-xs">Calculate I</Button>
        </div>
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Resistance (Ω)</label>
          <input
            type="number"
            value={resistance}
            onChange={(e) => setResistance(e.target.value)}
            placeholder="12"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
          <Button onClick={() => calculate('resistance')} size="sm" className="w-full mt-1 text-xs">Calculate R</Button>
        </div>
      </div>
    </div>
  );
}

function CarpenterCalculator() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thickness, setThickness] = useState('');
  const [boardFeet, setBoardFeet] = useState('');

  const calculateBoardFeet = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const t = parseFloat(thickness);
    if (l && w && t) {
      const bf = (l * w * t) / 144;
      setBoardFeet(bf.toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-blue-900">🪵 Board Foot Calculator</h4>
      <p className="text-xs text-gray-600">Board Feet = (Length × Width × Thickness) ÷ 144</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Length (inches)</label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="96"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Width (inches)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="6"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Thickness (inches)</label>
          <input
            type="number"
            value={thickness}
            onChange={(e) => setThickness(e.target.value)}
            placeholder="1"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <Button onClick={calculateBoardFeet} className="w-full">Calculate Board Feet</Button>
      {boardFeet && (
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <p className="text-sm font-bold text-blue-900">Result: {boardFeet} board feet</p>
        </div>
      )}
    </div>
  );
}

function WelderCalculator() {
  const [voltage, setVoltage] = useState('');
  const [amperage, setAmperage] = useState('');
  const [wattage, setWattage] = useState('');

  const calculate = () => {
    const v = parseFloat(voltage);
    const a = parseFloat(amperage);
    if (v && a) {
      setWattage((v * a).toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-blue-900">🔥 Welding Power Calculator</h4>
      <p className="text-xs text-gray-600">Power (Watts) = Voltage × Amperage</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Voltage (V)</label>
          <input
            type="number"
            value={voltage}
            onChange={(e) => setVoltage(e.target.value)}
            placeholder="20"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-blue-700 block mb-1">Amperage (A)</label>
          <input
            type="number"
            value={amperage}
            onChange={(e) => setAmperage(e.target.value)}
            placeholder="150"
            className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <Button onClick={calculate} className="w-full">Calculate Power</Button>
      {wattage && (
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <p className="text-sm font-bold text-blue-900">Power Output: {wattage} watts</p>
        </div>
      )}
    </div>
  );
}

function GenericCalculator({ mathConcept }: { mathConcept: string }) {
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-blue-900">🧮 Trade Math Concept</h4>
      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <p className="text-sm text-blue-900 leading-relaxed">{mathConcept}</p>
      </div>
      <p className="text-xs text-gray-600 italic">
        This trade requires mastery of the above mathematical concept. Practice these calculations daily.
      </p>
    </div>
  );
}

export default function TradeCareerDossier() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params?.tradeId as string;
  
  const [dossier, setDossier] = useState<TradeDossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDossier = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/future-prep/trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tradeId }),
        });
        
        if (!res.ok) throw new Error('Failed to load trade dossier');
        
        const data = await res.json();
        setDossier(data);
      } catch (e) {
        console.error('Error loading trade dossier:', e);
        setError('Failed to load career information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (tradeId) {
      fetchDossier();
    }
  }, [tradeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading career dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-900 font-bold">{error || 'Trade not found'}</p>
            <Link href="/dashboard/college-prep">
              <Button className="mt-4">Back to Future Prep</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCalculator = () => {
    switch (tradeId) {
      case 'electrician':
        return <ElectricianCalculator />;
      case 'carpenter':
        return <CarpenterCalculator />;
      case 'welder':
        return <WelderCalculator />;
      default:
        return <GenericCalculator mathConcept={dossier.mathConcept} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF]">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 border-b border-blue-800">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard/college-prep">
            <Button variant="ghost" className="text-white hover:bg-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Future Prep
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">{dossier.tradeName}</h1>
          <p className="text-blue-300 mt-2">Career Dossier — The Blueprint & The Simulator</p>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Column 1: The Blueprint */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-blue-900">The Blueprint</h2>
                </div>
                
                {/* Hours to Journeyman */}
                <div className="mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-700 mb-2">
                    Time Investment
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <p className="text-2xl font-bold text-blue-900">{dossier.hoursToJourneyman}</p>
                    <p className="text-xs text-blue-600 mt-1">to reach Journeyman status</p>
                  </div>
                </div>

                {/* Pay Scale */}
                <div className="mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Pay Progression
                  </h3>
                  <div className="space-y-2">
                    <div className="bg-amber-50 p-3 rounded-lg border-2 border-amber-200">
                      <p className="text-xs font-bold text-amber-700 uppercase">Apprentice</p>
                      <p className="text-lg font-bold text-amber-900">{dossier.payScale.apprentice}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                      <p className="text-xs font-bold text-green-700 uppercase">Journeyman</p>
                      <p className="text-lg font-bold text-green-900">{dossier.payScale.journeyman}</p>
                    </div>
                    {dossier.payScale.master && (
                      <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                        <p className="text-xs font-bold text-purple-700 uppercase">Master</p>
                        <p className="text-lg font-bold text-purple-900">{dossier.payScale.master}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gritty Reality */}
                <div className="mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    The Gritty Reality
                  </h3>
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <p className="text-sm text-red-900 leading-relaxed">{dossier.grittyReality}</p>
                  </div>
                </div>

                {/* Physical Demands */}
                <div className="mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-700 mb-2">
                    Physical Demands
                  </h3>
                  <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                    <p className="text-sm text-orange-900 leading-relaxed">{dossier.physicalDemands}</p>
                  </div>
                </div>

                {/* Certifications */}
                {dossier.certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-700 mb-2">
                      Required Certifications
                    </h3>
                    <ul className="space-y-2">
                      {dossier.certifications.map((cert, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: The Simulator */}
          <div className="space-y-6">
            <Card className="border-2 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-bold text-emerald-900">The Simulator</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Master the math. This is what you'll use on the job site every single day.
                </p>
                
                {renderCalculator()}
              </CardContent>
            </Card>

            {/* Math Mastery Card */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-purple-900 mb-3">📐 Math Mastery Required</h3>
                <p className="text-sm text-purple-800 leading-relaxed mb-4">
                  {dossier.mathConcept}
                </p>
                <p className="text-xs text-purple-600 italic">
                  If you can't do this math in your head, you're not ready for the job site. Practice daily.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

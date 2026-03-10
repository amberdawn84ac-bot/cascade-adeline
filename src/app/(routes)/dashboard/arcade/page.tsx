'use client';

import { useState } from 'react';
import { Gamepad2, Tractor, Hammer, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ─── Farm OS Simulator ──────────────────────────────────────────────────────

function FarmOS() {
  const [activeCalc, setActiveCalc] = useState<'feed' | 'yield' | 'thermal'>('feed');

  // Feed Calculator
  const [animalType, setAnimalType] = useState<'sheep' | 'chickens' | 'horses'>('sheep');
  const [animalCount, setAnimalCount] = useState(5);
  const [winterWeeks, setWinterWeeks] = useState(16);

  // Crop Yield
  const [acres, setAcres] = useState(0.5);
  const [cropType, setCropType] = useState<'tomatoes' | 'squash' | 'potatoes' | 'garlic'>('tomatoes');
  const [pricePerLb, setPricePerLb] = useState(2.5);

  // Thermal Mass (greenhouse heating)
  const [length, setLength] = useState(60);
  const [width, setWidth] = useState(16);
  const [outsideTemp, setOutsideTemp] = useState(10);
  const [targetTemp, setTargetTemp] = useState(50);

  // ─── Feed calculations ─────────────────────────────────────
  const DAILY_HAY_LBS: Record<string, number> = { sheep: 4, chickens: 0.25, horses: 20 };
  const DAILY_GRAIN_LBS: Record<string, number> = { sheep: 0.5, chickens: 0.125, horses: 5 };
  const totalHay = animalCount * DAILY_HAY_LBS[animalType] * winterWeeks * 7;
  const totalGrain = animalCount * DAILY_GRAIN_LBS[animalType] * winterWeeks * 7;
  const hayBales = Math.ceil(totalHay / 50);
  const feedCost = (totalHay * 0.12) + (totalGrain * 0.25);

  // ─── Crop yield calculations ─────────────────────────────────
  const YIELD_LBS_PER_ACRE: Record<string, number> = { tomatoes: 15000, squash: 8000, potatoes: 20000, garlic: 2000 };
  const cropYield = acres * YIELD_LBS_PER_ACRE[cropType];
  const grossRevenue = cropYield * pricePerLb;
  const inputCost = acres * 800;
  const profit = grossRevenue - inputCost;

  // ─── Thermal mass (simplified BTU/hr heat loss) ──────────────
  const floorArea = length * width;
  const glazingArea = (2 * (length * 8) + 2 * (width * 8)) * 0.7;
  const deltaT = targetTemp - outsideTemp;
  const btuPerHour = glazingArea * 0.75 * deltaT;
  const waterGallons = Math.ceil((btuPerHour * 12) / (8.34 * 20));

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'feed' as const, label: '🌾 Winter Feed', desc: 'Hay & grain ratios' },
          { id: 'yield' as const, label: '🌱 Crop Yield', desc: 'Harvest & profit' },
          { id: 'thermal' as const, label: '🌡 Thermal Mass', desc: 'Greenhouse heat' },
        ].map(c => (
          <button key={c.id} onClick={() => setActiveCalc(c.id)}
            className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${activeCalc === c.id ? 'bg-[#2F4731] text-white border-[#2F4731]' : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#2F4731]/40'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {activeCalc === 'feed' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-[#2F4731] text-xs uppercase tracking-widest">Inputs</h3>
              <label className="block">
                <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Animal Type</span>
                <select value={animalType} onChange={e => setAnimalType(e.target.value as typeof animalType)}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]">
                  <option value="sheep">Sheep</option>
                  <option value="chickens">Chickens</option>
                  <option value="horses">Horses</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Number of Animals</span>
                <input type="number" value={animalCount} min={1} max={200}
                  onChange={e => setAnimalCount(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Winter Length (weeks)</span>
                <input type="number" value={winterWeeks} min={4} max={26}
                  onChange={e => setWinterWeeks(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
              </label>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#2F4731] bg-[#2F4731] text-white">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-white/60 text-xs uppercase tracking-widest">Results</h3>
              <div className="space-y-3">
                <div><p className="text-white/60 text-xs">Total Hay Needed</p><p className="text-2xl font-black">{totalHay.toLocaleString()} lbs</p><p className="text-white/60 text-sm">≈ {hayBales} bales at 50 lb each</p></div>
                <div><p className="text-white/60 text-xs">Total Grain Needed</p><p className="text-2xl font-black">{totalGrain.toLocaleString()} lbs</p></div>
                <div className="border-t border-white/20 pt-3"><p className="text-white/60 text-xs">Estimated Feed Cost</p><p className="text-2xl font-black text-[#BD6809]">${feedCost.toFixed(2)}</p><p className="text-white/60 text-xs">at $0.12/lb hay · $0.25/lb grain</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeCalc === 'yield' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-[#2F4731] text-xs uppercase tracking-widest">Inputs</h3>
              <label className="block">
                <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Crop</span>
                <select value={cropType} onChange={e => setCropType(e.target.value as typeof cropType)}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]">
                  <option value="tomatoes">Tomatoes</option>
                  <option value="squash">Squash</option>
                  <option value="potatoes">Potatoes</option>
                  <option value="garlic">Garlic</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Acreage</span>
                <input type="number" value={acres} min={0.1} max={10} step={0.1}
                  onChange={e => setAcres(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Sale Price ($/lb)</span>
                <input type="number" value={pricePerLb} min={0.5} max={20} step={0.25}
                  onChange={e => setPricePerLb(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
              </label>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#2F4731] bg-[#2F4731] text-white">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-white/60 text-xs uppercase tracking-widest">Results</h3>
              <div className="space-y-3">
                <div><p className="text-white/60 text-xs">Est. Yield</p><p className="text-2xl font-black">{cropYield.toLocaleString()} lbs</p></div>
                <div><p className="text-white/60 text-xs">Gross Revenue</p><p className="text-2xl font-black">${grossRevenue.toLocaleString()}</p></div>
                <div><p className="text-white/60 text-xs">Input Costs (est.)</p><p className="text-lg font-bold text-white/70">– ${inputCost.toFixed(0)}</p></div>
                <div className="border-t border-white/20 pt-3"><p className="text-white/60 text-xs">Net Profit</p>
                  <p className={`text-2xl font-black ${profit >= 0 ? 'text-[#BD6809]' : 'text-red-300'}`}>${profit.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeCalc === 'thermal' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-[#2F4731] text-xs uppercase tracking-widest">Greenhouse Inputs</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Length (ft)</span>
                  <input type="number" value={length} onChange={e => setLength(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Width (ft)</span>
                  <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Outside Temp (°F)</span>
                  <input type="number" value={outsideTemp} onChange={e => setOutsideTemp(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-[#2F4731]/60 uppercase">Target Temp (°F)</span>
                  <input type="number" value={targetTemp} onChange={e => setTargetTemp(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" />
                </label>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#2F4731] bg-[#2F4731] text-white">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-white/60 text-xs uppercase tracking-widest">Results</h3>
              <div className="space-y-3">
                <div><p className="text-white/60 text-xs">Floor Area</p><p className="text-2xl font-black">{floorArea} sq ft</p></div>
                <div><p className="text-white/60 text-xs">Heat Loss Rate</p><p className="text-2xl font-black">{btuPerHour.toLocaleString()} BTU/hr</p></div>
                <div className="border-t border-white/20 pt-3"><p className="text-white/60 text-xs">Water Barrels for Thermal Mass</p><p className="text-2xl font-black text-[#BD6809]">{waterGallons} gallons</p><p className="text-white/60 text-xs">≈ {Math.ceil(waterGallons / 55)} × 55-gal barrels</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Trade Logistics Simulator ──────────────────────────────────────────────

function TradeLogistics() {
  const [activeCalc, setActiveCalc] = useState<'boardfeet' | 'profit'>('boardfeet');

  // Board-foot calculator
  const [pieces, setPieces] = useState(10);
  const [thicknessIn, setThicknessIn] = useState(1.5);
  const [widthIn, setWidthIn] = useState(8);
  const [lengthFt, setLengthFt] = useState(8);
  const [costPerBF, setCostPerBF] = useState(8);

  // Profit margin
  const [materialCost, setMaterialCost] = useState(120);
  const [laborHours, setLaborHours] = useState(6);
  const [laborRate, setLaborRate] = useState(25);
  const [overhead, setOverhead] = useState(15);
  const [sellingPrice, setSellingPrice] = useState(350);

  // Calculations
  const boardFeet = (pieces * thicknessIn * widthIn * lengthFt) / 12;
  const lumberCost = boardFeet * costPerBF;

  const totalCost = materialCost + (laborHours * laborRate) + overhead;
  const grossProfit = sellingPrice - totalCost;
  const marginPct = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const markupPct = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[
          { id: 'boardfeet' as const, label: '📐 Board-Foot Calculator' },
          { id: 'profit' as const, label: '💰 Project P&L' },
        ].map(c => (
          <button key={c.id} onClick={() => setActiveCalc(c.id)}
            className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${activeCalc === c.id ? 'bg-[#2F4731] text-white border-[#2F4731]' : 'border-[#E7DAC3] text-[#2F4731] hover:border-[#2F4731]/40'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {activeCalc === 'boardfeet' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-[#2F4731] text-xs uppercase tracking-widest">Lumber Specs</h3>
              <p className="text-xs text-[#2F4731]/50 italic">Formula: (pieces × T″ × W″ × L′) ÷ 12</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase"># Pieces</span>
                  <input type="number" value={pieces} min={1} onChange={e => setPieces(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
                <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Thickness (in)</span>
                  <input type="number" value={thicknessIn} min={0.5} step={0.25} onChange={e => setThicknessIn(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
                <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Width (in)</span>
                  <input type="number" value={widthIn} min={1} onChange={e => setWidthIn(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
                <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Length (ft)</span>
                  <input type="number" value={lengthFt} min={1} onChange={e => setLengthFt(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
              </div>
              <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Walnut Price ($/BF)</span>
                <input type="number" value={costPerBF} min={1} step={0.5} onChange={e => setCostPerBF(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#2F4731] bg-[#2F4731] text-white">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-white/60 text-xs uppercase tracking-widest">Results</h3>
              <div className="space-y-3">
                <div><p className="text-white/60 text-xs">Total Board Feet</p><p className="text-3xl font-black">{boardFeet.toFixed(2)} BF</p></div>
                <div className="border-t border-white/20 pt-3"><p className="text-white/60 text-xs">Lumber Cost</p><p className="text-2xl font-black text-[#BD6809]">${lumberCost.toFixed(2)}</p><p className="text-white/60 text-xs">at ${costPerBF}/BF for black walnut</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeCalc === 'profit' && (
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-2 border-[#E7DAC3]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-[#2F4731] text-xs uppercase tracking-widest">Project Costs</h3>
              <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Materials ($)</span>
                <input type="number" value={materialCost} onChange={e => setMaterialCost(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Labor Hours</span>
                  <input type="number" value={laborHours} onChange={e => setLaborHours(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
                <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Rate ($/hr)</span>
                  <input type="number" value={laborRate} onChange={e => setLaborRate(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
              </div>
              <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Overhead & Finishing ($)</span>
                <input type="number" value={overhead} onChange={e => setOverhead(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
              <label className="block"><span className="text-xs font-bold text-[#2F4731]/60 uppercase">Selling Price ($)</span>
                <input type="number" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))}
                  className="mt-1 w-full border-2 border-[#E7DAC3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2F4731]" /></label>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#2F4731] bg-[#2F4731] text-white">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-black text-white/60 text-xs uppercase tracking-widest">P&L Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Materials</span><span>${materialCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Labor ({laborHours}h × ${laborRate})</span><span>${(laborHours * laborRate).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Overhead</span><span>${overhead.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t border-white/20 pt-2"><span>Total Cost</span><span>${totalCost.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-[#BD6809]"><span>Selling Price</span><span>${sellingPrice.toFixed(2)}</span></div>
              </div>
              <div className="border-t border-white/20 pt-3 space-y-2">
                <div><p className="text-white/60 text-xs">Gross Profit</p>
                  <p className={`text-2xl font-black ${grossProfit >= 0 ? 'text-[#BD6809]' : 'text-red-300'}`}>${grossProfit.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/10 rounded-xl p-2"><p className="text-white/60 text-xs">Margin</p><p className="font-black text-lg">{marginPct.toFixed(1)}%</p></div>
                  <div className="bg-white/10 rounded-xl p-2"><p className="text-white/60 text-xs">Markup</p><p className="font-black text-lg">{markupPct.toFixed(1)}%</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ArcadePage() {
  const [activeSection, setActiveSection] = useState<'farmos' | 'trade'>('farmos');

  return (
    <div className="flex flex-col min-h-full bg-[#FFFEF7]">
      {/* Header */}
      <div className="p-6 border-b border-[#E7DAC3] bg-[#E7DAC3]/40">
        <h1 className="text-3xl font-bold text-[#2F4731] flex items-center gap-3">
          <Gamepad2 className="w-8 h-8" /> Arcade
        </h1>
        <p className="text-[#2F4731]/60 text-sm mt-1 italic">Applied math workshop — real numbers, real problems.</p>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Section Switcher */}
        <div className="grid md:grid-cols-2 gap-4">
          <button onClick={() => setActiveSection('farmos')}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${activeSection === 'farmos' ? 'border-[#2F4731] bg-[#2F4731] text-white shadow-xl' : 'border-[#E7DAC3] bg-white hover:border-[#2F4731]/30'}`}>
            <Tractor className={`w-8 h-8 mb-2 ${activeSection === 'farmos' ? 'text-[#BD6809]' : 'text-[#2F4731]'}`} />
            <h2 className="text-xl font-black">Farm OS</h2>
            <p className={`text-sm mt-1 ${activeSection === 'farmos' ? 'text-white/70' : 'text-[#2F4731]/60'}`}>
              Winter feed ratios · crop yields · greenhouse thermal mass
            </p>
          </button>
          <button onClick={() => setActiveSection('trade')}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${activeSection === 'trade' ? 'border-[#2F4731] bg-[#2F4731] text-white shadow-xl' : 'border-[#E7DAC3] bg-white hover:border-[#2F4731]/30'}`}>
            <Hammer className={`w-8 h-8 mb-2 ${activeSection === 'trade' ? 'text-[#BD6809]' : 'text-[#2F4731]'}`} />
            <h2 className="text-xl font-black">Trade Logistics</h2>
            <p className={`text-sm mt-1 ${activeSection === 'trade' ? 'text-white/70' : 'text-[#2F4731]/60'}`}>
              Board-foot costs · walnut woodshop P&L · profit margins
            </p>
          </button>
        </div>

        {/* Active Simulator */}
        {activeSection === 'farmos' ? <FarmOS /> : <TradeLogistics />}

        <p className="text-xs text-[#2F4731]/30 text-center pt-4 flex items-center justify-center gap-1">
          <RotateCcw className="w-3 h-3" /> All calculations update live — no submit button needed.
        </p>
      </div>
    </div>
  );
}

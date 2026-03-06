'use client';

import { useState } from 'react';
import { Hammer, Package, Ruler, DollarSign, TrendingUp, Calculator, Wrench, Heart, HandHeart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MathPage() {

  return (
    <div className="min-h-screen bg-[#FFFEF7] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7]">
              <Hammer size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Applied Mathematics Workshop
              </h1>
              <p className="text-[#2F4731]/70 text-lg" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Real-world math for builders, traders, and entrepreneurs
              </p>
            </div>
          </div>
        </div>

        {/* Project Workshops - Real-World Applications */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Architectural Geometry */}
          <Card className="border-2 border-[#BD6809]/20 hover:border-[#BD6809] transition-all hover:shadow-xl cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7] group-hover:bg-[#BD6809] transition-colors">
                  <Ruler size={28} />
                </div>
                <Badge className="bg-amber-600 text-white">Geometry</Badge>
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Architectural Geometry
              </CardTitle>
              <CardDescription className="text-base">
                Calculate structural loads, framing, and materials for real building projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#E7DAC3] p-4 rounded-xl">
                <h4 className="font-bold text-[#2F4731] mb-3 text-sm uppercase">Real Projects:</h4>
                <ul className="space-y-2 text-sm text-[#2F4731]/80">
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>16x60 Saltbox Barn: Calculate roof pitch, rafter lengths, and board feet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Greenhouse Foundation: Determine concrete volume and rebar spacing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Deck Framing: Calculate joist spacing and load-bearing capacity</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E7DAC3]">
                <p className="text-xs text-[#2F4731]/60 italic">
                  Master Pythagorean theorem, trigonometry, and structural engineering math
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-purple-600" />
                    <h5 className="text-xs font-bold text-purple-900">Character: Diligence</h5>
                  </div>
                  <p className="text-xs text-purple-800">Precision and careful measurement build integrity in craftsmanship</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <HandHeart className="h-4 w-4 text-green-600" />
                    <h5 className="text-xs font-bold text-green-900">Community Impact</h5>
                  </div>
                  <p className="text-xs text-green-800">Build structures for your family, neighbors, or local community projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* E-commerce & Logistics */}
          <Card className="border-2 border-[#BD6809]/20 hover:border-[#BD6809] transition-all hover:shadow-xl cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7] group-hover:bg-[#BD6809] transition-colors">
                  <Package size={28} />
                </div>
                <Badge className="bg-green-600 text-white">Business Math</Badge>
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                E-commerce & Logistics
              </CardTitle>
              <CardDescription className="text-base">
                Calculate landed costs, tariffs, and supply chain margins for global trade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#E7DAC3] p-4 rounded-xl">
                <h4 className="font-bold text-[#2F4731] mb-3 text-sm uppercase">Real Scenarios:</h4>
                <ul className="space-y-2 text-sm text-[#2F4731]/80">
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Import Costing: Calculate HS code tariffs, shipping, and customs fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Landed Cost Analysis: Determine true product cost including all fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Margin Optimization: Calculate break-even and profit margins</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E7DAC3]">
                <p className="text-xs text-[#2F4731]/60 italic">
                  Master percentages, exchange rates, and international trade mathematics
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-purple-600" />
                    <h5 className="text-xs font-bold text-purple-900">Character: Stewardship</h5>
                  </div>
                  <p className="text-xs text-purple-800">Wise resource management and fair pricing honor both buyer and seller</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <HandHeart className="h-4 w-4 text-green-600" />
                    <h5 className="text-xs font-bold text-green-900">Community Impact</h5>
                  </div>
                  <p className="text-xs text-green-800">Help family businesses price fairly and source products that serve your community</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Shop Economics */}
          <Card className="border-2 border-[#BD6809]/20 hover:border-[#BD6809] transition-all hover:shadow-xl cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-[#2F4731] rounded-xl text-[#FFFEF7] group-hover:bg-[#BD6809] transition-colors">
                  <Wrench size={28} />
                </div>
                <Badge className="bg-blue-600 text-white">Economics</Badge>
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
                Trade Shop Economics
              </CardTitle>
              <CardDescription className="text-base">
                Calculate material costs, labor rates, and profit margins for skilled trades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#E7DAC3] p-4 rounded-xl">
                <h4 className="font-bold text-[#2F4731] mb-3 text-sm uppercase">Real Workshops:</h4>
                <ul className="space-y-2 text-sm text-[#2F4731]/80">
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Walnut Woodworking: Calculate board feet, waste factor, and pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Custom Furniture: Determine material costs and labor hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#BD6809]">•</span>
                    <span>Shop Overhead: Calculate true hourly rate including fixed costs</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E7DAC3]">
                <p className="text-xs text-[#2F4731]/60 italic">
                  Master unit conversion, cost estimation, and small business finance
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-purple-600" />
                    <h5 className="text-xs font-bold text-purple-900">Character: Craftsmanship</h5>
                  </div>
                  <p className="text-xs text-purple-800">Excellence in work honors the materials, the craft, and those who will use it</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <HandHeart className="h-4 w-4 text-green-600" />
                    <h5 className="text-xs font-bold text-green-900">Community Impact</h5>
                  </div>
                  <p className="text-xs text-green-800">Create heirloom furniture or teach woodworking skills to the next generation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Why This Matters */}
        <div className="bg-white rounded-[2rem] p-8 border-2 border-[#BD6809]/20">
          <h2 className="text-2xl font-bold text-[#2F4731] mb-6" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
            Why Applied Mathematics?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calculator className="w-8 h-8 text-[#BD6809]" />
                <h3 className="font-bold text-[#2F4731]">Real Skills, Real Value</h3>
              </div>
              <p className="text-[#2F4731]/70 text-sm leading-relaxed">
                These aren't abstract problems. You're learning the exact math that architects, importers, and craftsmen use daily to run profitable businesses.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-[#BD6809]" />
                <h3 className="font-bold text-[#2F4731]">Economic Literacy</h3>
              </div>
              <p className="text-[#2F4731]/70 text-sm leading-relaxed">
                Understand how pricing works, why things cost what they do, and how to calculate true profitability in any venture.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-[#BD6809]" />
                <h3 className="font-bold text-[#2F4731]">Immediate Application</h3>
              </div>
              <p className="text-[#2F4731]/70 text-sm leading-relaxed">
                Use these calculations today for your own projects, side hustles, or family business. Math becomes a tool, not a chore.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-[#E7DAC3] rounded-[2rem] p-6 border-2 border-[#BD6809]/20 text-center">
          <p className="text-[#2F4731] italic" style={{ fontFamily: 'var(--font-kalam), cursive' }}>
            Interactive calculators and project templates coming soon. For now, work through these scenarios with pencil and paper - the old-fashioned way builds deeper understanding.
          </p>
        </div>
      </div>
    </div>
  );
}

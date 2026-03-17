import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { loadConfig } from '@/lib/config';

const tradeDossierSchema = z.object({
  tradeName: z.string().describe("The full name of the trade (e.g., 'Electrician', 'Plumber', 'HVAC Technician')"),
  hoursToJourneyman: z.string().describe("Exact hours required to reach Journeyman status (e.g., '8,000 hours (4-5 years)')"),
  payScale: z.object({
    apprentice: z.string().describe("Realistic apprentice pay range (e.g., '$15-25/hour')"),
    journeyman: z.string().describe("Realistic journeyman pay range (e.g., '$30-45/hour')"),
    master: z.string().optional().describe("Master tradesperson pay if applicable (e.g., '$50-70/hour')"),
  }).describe("Realistic pay progression from apprentice to journeyman to master"),
  grittyReality: z.string().describe("The unvarnished physical and mental reality of this job. Do NOT sugarcoat. Include: weather conditions, physical toll, injury risks, job site culture, seasonal work patterns, and mental demands. Be specific and honest."),
  physicalDemands: z.string().describe("Specific physical requirements: lifting weight, climbing, kneeling, overhead work, exposure to elements, etc."),
  mathConcept: z.string().describe("The core mathematical concept they MUST master for this trade. Be specific about the formulas and calculations they'll use daily on the job site."),
  certifications: z.array(z.string()).describe("List of required certifications, licenses, or credentials needed to work in this trade"),
});

// Hardcoded trade data for common trades
const HARDCODED_TRADES: Record<string, z.infer<typeof tradeDossierSchema>> = {
  electrician: {
    tradeName: 'Electrician',
    hoursToJourneyman: '8,000 hours (4-5 years)',
    payScale: {
      apprentice: '$15-25/hour',
      journeyman: '$30-45/hour',
      master: '$50-70/hour',
    },
    grittyReality: "You'll work in crawl spaces, attics in 120°F heat, and freezing job sites in winter. Electrical work is dangerous—one mistake can kill you or someone else. You'll deal with demanding contractors, tight deadlines, and physically exhausting 10-12 hour days. The work is mentally taxing because you must constantly calculate loads, follow complex code requirements, and troubleshoot systems. Job sites can be loud, dirty, and stressful. Expect to be on your feet all day, climbing ladders, and working in awkward positions.",
    physicalDemands: "Lifting 50+ lbs regularly, climbing ladders and scaffolding, working overhead for extended periods, kneeling/crouching in tight spaces, fine motor skills for wire work, standing 8-12 hours daily. Risk of electrical shock, burns, and falls.",
    mathConcept: "Ohm's Law (V = I × R) and electrical load calculations. You must be able to calculate voltage, current, resistance, power (watts), and circuit loads in your head. You'll also need to understand three-phase power, voltage drop calculations, and wire sizing based on amperage and distance.",
    certifications: [
      "State Electrical License (Journeyman)",
      "OSHA 10 or 30-Hour Safety Certification",
      "National Electrical Code (NEC) knowledge",
      "Local jurisdiction permits and inspections",
    ],
  },
  plumber: {
    tradeName: 'Plumber',
    hoursToJourneyman: '8,000-10,000 hours (5 years)',
    payScale: {
      apprentice: '$15-22/hour',
      journeyman: '$28-42/hour',
      master: '$45-65/hour',
    },
    grittyReality: "You will work with human waste, sewage, and contaminated water regularly. Expect to crawl under houses, work in flooded basements, and deal with emergency calls at 2 AM. The work is physically brutal—digging trenches, lifting cast iron pipes, and working in cramped spaces. You'll encounter angry customers, leaking pipes that spray you with filth, and job sites with no heat or AC. Winter work means frozen pipes and outdoor repairs in freezing conditions. The job is dirty, smelly, and often thankless.",
    physicalDemands: "Heavy lifting (pipes, water heaters 100+ lbs), digging trenches, crawling in tight spaces, working in wet/dirty conditions, kneeling for extended periods, exposure to sewage and chemicals. High risk of back injury and repetitive strain.",
    mathConcept: "Pipe slope calculations (1/4 inch per foot for drainage), flow rate calculations (GPM - gallons per minute), pressure calculations (PSI), and fixture unit calculations for sizing drain and supply lines. You must understand volume, area, and basic trigonometry for pipe angles.",
    certifications: [
      "State Plumbing License (Journeyman)",
      "Backflow Prevention Certification",
      "Gas Line Certification (if working with gas)",
      "OSHA Safety Training",
    ],
  },
  welder: {
    tradeName: 'Welder',
    hoursToJourneyman: '4,000-6,000 hours (2-3 years)',
    payScale: {
      apprentice: '$16-24/hour',
      journeyman: '$25-40/hour',
      master: '$45-70/hour (pipeline/underwater)',
    },
    grittyReality: "Welding is hot, dangerous, and physically demanding. You'll work in extreme heat from the arc and the environment—summer job sites can be brutal. Sparks, molten metal, and UV radiation are constant hazards. You'll breathe metal fumes even with ventilation, and long-term exposure can cause respiratory issues. Pipeline and structural welding often means traveling for months, living in motels, and working 60-80 hour weeks. The work is repetitive and hard on your body—neck, back, and shoulders take a beating from holding awkward positions. Mistakes can be catastrophic in structural or pressure vessel work.",
    physicalDemands: "Holding welding torch in fixed positions for extended periods, working overhead and in confined spaces, lifting heavy metal pieces, exposure to extreme heat and UV light, standing/kneeling for long hours. Risk of burns, eye damage, and respiratory issues.",
    mathConcept: "Welding power calculations (Voltage × Amperage = Wattage), metal expansion/contraction rates, joint geometry and angles, and material thickness calculations for proper penetration. You must understand electrical principles, heat transfer, and basic metallurgy.",
    certifications: [
      "AWS (American Welding Society) Certification",
      "Specific process certifications (MIG, TIG, Stick, Flux-Core)",
      "Pressure vessel welding certification (ASME)",
      "Pipeline welding certification (API 1104)",
    ],
  },
  carpenter: {
    tradeName: 'Carpenter',
    hoursToJourneyman: '6,000-8,000 hours (3-4 years)',
    payScale: {
      apprentice: '$14-20/hour',
      journeyman: '$25-38/hour',
      master: '$40-60/hour',
    },
    grittyReality: "Carpentry is physically brutal. You'll lift heavy lumber, work on your knees installing flooring, and climb scaffolding in all weather conditions. Summer heat on roofing jobs is dangerous—heat exhaustion is common. Winter framing means frozen fingers and working in snow. Power tool accidents (saws, nail guns) can cause life-changing injuries. Job sites are loud, dusty, and chaotic. You'll deal with demanding contractors, tight deadlines, and constant pressure to work faster. The work destroys your knees, back, and shoulders over time.",
    physicalDemands: "Lifting 50-100 lbs repeatedly, climbing ladders and scaffolding, kneeling for flooring/trim work, working overhead for framing, standing all day, fine motor skills for finish work. High risk of cuts, falls, and repetitive strain injuries.",
    mathConcept: "Board foot calculations [(Length × Width × Thickness) ÷ 144], roof pitch and rafter calculations (rise over run), stair stringer geometry, and material estimation. You must master fractions, angles, and the Pythagorean theorem for square layouts.",
    certifications: [
      "OSHA 10 or 30-Hour Construction Safety",
      "Scaffold Safety Certification",
      "Fall Protection Training",
      "Journeyman Carpenter License (varies by state)",
    ],
  },
  hvac: {
    tradeName: 'HVAC Technician',
    hoursToJourneyman: '5,000-7,000 hours (3-4 years)',
    payScale: {
      apprentice: '$15-22/hour',
      journeyman: '$28-42/hour',
      master: '$45-65/hour',
    },
    grittyReality: "You'll work in extreme temperatures—130°F attics in summer, freezing rooftops in winter. HVAC work means crawling through filthy crawl spaces, breathing insulation fibers, and handling refrigerants that can cause frostbite or suffocation. Emergency calls mean working nights, weekends, and holidays when everyone else is comfortable. You'll deal with angry customers whose AC died in a heatwave. The work is physically demanding—carrying heavy equipment up ladders, working in tight spaces, and troubleshooting complex electrical and mechanical systems under pressure.",
    physicalDemands: "Lifting 50-100 lbs (condensers, furnaces), climbing ladders with equipment, working in extreme heat/cold, crawling in attics and crawl spaces, fine motor skills for electrical work, standing/kneeling for extended periods. Exposure to refrigerants, insulation, and electrical hazards.",
    mathConcept: "Heat load calculations (BTU requirements), airflow calculations (CFM - cubic feet per minute), refrigerant pressure-temperature relationships, electrical calculations for compressor loads, and duct sizing formulas. You must understand thermodynamics, psychrometrics, and electrical theory.",
    certifications: [
      "EPA Section 608 Certification (required for refrigerant handling)",
      "State HVAC License",
      "NATE Certification (North American Technician Excellence)",
      "Electrical certifications for HVAC controls",
    ],
  },
  farrier: {
    tradeName: 'Farrier',
    hoursToJourneyman: '2,000-3,000 hours (1-2 years apprenticeship)',
    payScale: {
      apprentice: '$12-18/hour',
      journeyman: '$25-50/hour (per horse)',
      master: '$60-100/hour (specialized/competition horses)',
    },
    grittyReality: "Farrier work is one of the most physically demanding trades. You'll spend your entire day bent over, holding a 1,000+ lb horse's leg while trimming and shaping hot metal. Horses kick—you will get hurt. The work is outdoors in all weather: freezing winters, blazing summers, mud, rain, and dust. Your back, knees, and shoulders will be destroyed by age 50 if you don't take care of your body. You're self-employed, which means no benefits, no guaranteed income, and constant travel between barns. Clients can be demanding and will blame you if their horse goes lame. The smell of burning hoof and manure is constant.",
    physicalDemands: "Bent over for 6-10 hours daily, holding horse legs (100+ lbs of pressure), hammering and shaping metal, working in all weather conditions, heavy lifting (anvils, forges, tools), standing on uneven ground. Extreme risk of kicks, bites, and back injury.",
    mathConcept: "Hoof angle calculations (typically 45-55 degrees), shoe sizing and fit geometry, weight distribution calculations for corrective shoeing, and metal heating temperatures. You must understand angles, leverage, and biomechanics.",
    certifications: [
      "American Farrier's Association (AFA) Certification",
      "Certified Journeyman Farrier (CJF)",
      "Certified Master Farrier (CMF) - advanced level",
      "Liability insurance (required for professional work)",
    ],
  },
};

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const { tradeId } = await req.json();
    if (!tradeId) return NextResponse.json({ error: 'Missing tradeId' }, { status: 400 });

    // Check if we have hardcoded data for this trade
    const normalizedTradeId = tradeId.toLowerCase().replace(/[^a-z]/g, '');
    if (HARDCODED_TRADES[normalizedTradeId]) {
      return NextResponse.json(HARDCODED_TRADES[normalizedTradeId]);
    }

    // Generate dossier using AI for niche trades
    const config = loadConfig();
    const llm = new ChatOpenAI({
      model: config.models.default || 'gpt-4o',
      temperature: 0.7,
    }).withStructuredOutput(tradeDossierSchema);

    console.log('[future-prep/trade] Generating dossier for:', tradeId);

    const result = await llm.invoke([
      {
        role: 'system',
        content: `You are Adeline, a gritty, no-nonsense career mentor. The student is exploring the trade: "${tradeId}".

CRITICAL MISSION: Output a brutally honest career dossier. Do NOT sugarcoat. Do NOT romanticize. Tell them the REAL physical, mental, and financial reality of this trade.

You MUST provide:
1. hoursToJourneyman: The EXACT apprenticeship hours required (research industry standards)
2. payScale: REALISTIC pay ranges for apprentice, journeyman, and master levels (use current market rates)
3. grittyReality: The UNVARNISHED truth about this job. Include:
   - Physical toll on the body
   - Weather conditions and work environment
   - Injury risks and safety hazards
   - Job site culture and stress
   - Work-life balance reality
   - Long-term health impacts
4. physicalDemands: Specific physical requirements and risks
5. mathConcept: The CORE math they must master for this trade. Be specific about formulas and daily calculations.
6. certifications: Required licenses, certifications, and credentials

TONE: Be warm but relentless. You care about them, which is why you won't lie to them. If this trade will destroy their back by age 50, say so. If they need to master calculus, say so. If the pay is lower than they think, say so.

EXAMPLES OF GRITTY REALITY:
- "You'll work in 120°F attics and crawl through sewage"
- "Expect 60-hour weeks during busy season with no overtime pay"
- "Your knees will be shot by 45 if you don't protect them"
- "One mistake with high voltage can kill you"

Be specific. Be honest. Be useful.`,
      },
      {
        role: 'user',
        content: `Generate a complete career dossier for: ${tradeId}`,
      },
    ]);

    console.log('[future-prep/trade] Dossier generated successfully');

    return NextResponse.json(result);
  } catch (error) {
    console.error('[future-prep/trade] Error generating dossier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate trade dossier', details: errorMessage },
      { status: 500 }
    );
  }
}

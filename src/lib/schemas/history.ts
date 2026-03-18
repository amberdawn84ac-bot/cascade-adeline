import { z } from 'zod';

export const evidenceBoardSchema = z.object({
  topic: z.string().describe("The historical event or era being investigated"),
  standardNarrative: z.string().describe("The simplified, common textbook version of the event - what most history books say happened. Keep this concise and representative of the mainstream narrative."),
  primaryEvidence: z.string().describe("A simulated or real excerpt from a primary source (journal entry, law text, letter, newspaper clipping, court record) from that exact time period that adds nuance or contradicts the standard narrative. Format this as if it's the actual historical document - use period-appropriate language and style."),
  primarySourceCitation: z.string().describe("The exact name and date of the primary source document (e.g., 'Letter from Sarah Thompson to her sister, March 15, 1889' or 'Oklahoma Territorial Law 47, Section 3, 1893')"),
  localConnection: z.string().describe("How this specific historical event impacted the land, laws, or people in Oklahoma. Be specific - name actual towns, counties, tribes, or regions. If the event didn't directly impact Oklahoma, explain the parallel or related impact in the region."),
  detectiveQuestion: z.string().describe("A critical thinking question asking the student to compare the standard narrative with the primary evidence. Should prompt them to identify gaps, contradictions, or whose perspective is missing."),
  events: z.array(z.object({
    year: z.string(),
    title: z.string(),
    description: z.string()
  })).describe("3 to 5 specific timeline events that show the progression of this historical event"),
  modernParallel: z.string().describe("A current systemic issue that mirrors this historical pattern - be specific with names, cases, or policies"),
  actionPath: z.object({
    clemencyCampaign: z.string().optional().describe("If relevant, name a current clemency case or wrongfully imprisoned person that parallels this historical injustice"),
    policyReform: z.string().describe("Specific modern policy or law that perpetuates this historical harm (name the actual policy/law)"),
    advocacyTarget: z.string().describe("Who to petition or investigate today (specific agency, representative, or organization with contact method)"),
    draftLetter: z.string().describe("Complete advocacy letter template ready to send, with proper formatting and specific demands")
  }).describe("Concrete action path to address the modern parallel of this historical injustice"),
});

export type EvidenceBoard = z.infer<typeof evidenceBoardSchema>;

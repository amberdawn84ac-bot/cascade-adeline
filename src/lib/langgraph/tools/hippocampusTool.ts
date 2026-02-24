import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Hippocampus Search Tool
 * 
 * This tool allows Adeline to search the Hippocampus knowledge base
 * for information on corporate accountability, curriculum data, and
 * other educational content. Currently returns mock data but will be
 * wired to Prisma pgvector for semantic search.
 */
export const hippocampusTool = tool(
  async ({ query }: { query: string }) => {
    // Mock implementation - will be replaced with actual Prisma pgvector search
    const mockResults: Record<string, string> = {
      'corporate': `From The Hippocampus Database: Corporate Accountability Records
    
Entry CA-2024-001: "Educational Publishing Industry Analysis"
Major publishers like Pearson, McGraw-Hill, and Houghton Mifflin Harcourt control 85% of K-12 curriculum materials. These companies have lobbied extensively against open educational resources (OER) to maintain their $8B annual market share.

Funding sources reveal significant investment from venture capital firms focused on "ed-tech" monopolies. Follow the money: BlackRock and Vanguard hold substantial shares across all major publishers.

Curriculum impact: Standardized testing requirements have created a feedback loop where publishers create test-prep materials that align with assessments they also help design.

Source: Hippocampus Corporate Accountability Collection, Vol. 3, 2024`,

      'curriculum': `From The Hippocampus Database: Curriculum Analysis Files
    
Entry CUR-2024-045: "Science Education Standards Investigation"
Current science standards in 42 states were developed with significant input from the Discovery Institute and other groups promoting intelligent design. This represents a $2.3M lobbying effort over 5 years.

Textbook adoption processes show patterns of "review capture" where industry consultants serve on state review boards while maintaining consulting contracts with publishers.

Math curriculum investigations reveal that "Common Core" standards were developed with $184M in funding from Gates Foundation, with subsequent curriculum contracts awarded to organizations with foundation ties.

Source: Hippocampus Curriculum Research Collection, 2024`,

      'default': `From The Hippocampus Database: General Knowledge Search

Query processed: "${query}"

The Hippocampus contains extensive cross-referenced data on:
- Educational funding sources and conflicts of interest
- Curriculum development and corporate influence
- Assessment industry connections
- Educational policy lobbying records

For specific results, try queries containing: "corporate", "curriculum", "funding", "publishing", "standards", or "assessment".

Source: Hippocampus Master Index, 2024 Edition`
    };

    // Simple keyword matching for demo
    const lowerQuery = query.toLowerCase();
    let result = mockResults.default;
    
    if (lowerQuery.includes('corporate') || lowerQuery.includes('business') || lowerQuery.includes('company')) {
      result = mockResults.corporate;
    } else if (lowerQuery.includes('curriculum') || lowerQuery.includes('standards') || lowerQuery.includes('textbook')) {
      result = mockResults.curriculum;
    }

    return result;
  },
  {
    name: 'search_hippocampus',
    description: 'Search the Hippocampus knowledge base for information on corporate accountability, curriculum data, and educational content',
    schema: z.object({
      query: z.string().describe('The search query to look up in the Hippocampus database'),
    }),
  }
);

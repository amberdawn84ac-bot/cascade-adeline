import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { OpenAIEmbeddings } from '@langchain/openai';
import prisma from '@/lib/db';
import { loadConfig } from '@/lib/config';

/**
 * Hippocampus Search Tool - Live Implementation
 * 
 * This tool connects to the actual pgvector database to perform
 * semantic similarity search on uploaded primary sources, PDF excerpts,
 * corporate accountability records, and educational data.
 */
export const hippocampusTool = tool(
  async ({ query }: { query: string }) => {
    try {
      const config = loadConfig();
      const embeddingModelId = config.models.embeddings || 'text-embedding-3-small';

      // Initialize embedding model
      const embeddings = new OpenAIEmbeddings({
        model: embeddingModelId,
        dimensions: 1536,
      });

      // Generate embedding for the query
      const queryEmbedding = await embeddings.embedQuery(query);

      // Perform similarity search using pgvector
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          title,
          content,
          source_type,
          metadata,
          1 - (embedding <=> ${queryEmbedding}) as similarity
        FROM hippocampus_documents 
        WHERE 1 - (embedding <=> ${queryEmbedding}) > 0.7
        ORDER BY similarity DESC
        LIMIT 5
      `;

      // Format results for the AI
      if (Array.isArray(results) && results.length > 0) {
        const formattedResults = results.map((doc: any, index: number) => {
          const metadata = doc.metadata ? JSON.parse(doc.metadata as string) : {};
          
          return `Result ${index + 1}:
Title: ${doc.title}
Source Type: ${doc.source_type}
Similarity: ${(doc.similarity * 100).toFixed(1)}%
Content: ${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}
${metadata.uploadDate ? `Upload Date: ${metadata.uploadDate}` : ''}
${metadata.tags ? `Tags: ${metadata.tags}` : ''}
---`;
        }).join('\n\n');

        return `Hippocampus Database Search Results for "${query}":\n\n${formattedResults}\n\nSource: Hippocampus Vector Database, Live Search`;
      } else {
        return `Hippocampus Database Search Results for "${query}":\n\nNo relevant documents found in the database. The search returned no results with sufficient similarity (>70%).\n\nTry different keywords or check if documents have been uploaded to the Hippocampus library.\n\nSource: Hippocampus Vector Database, Live Search`;
      }

    } catch (error) {
      console.error('Hippocampus search error:', error);
      
      // Fallback to basic search if vector search fails
      try {
        const fallbackResults = await prisma.hippocampusDocument.findMany({
          where: {
            OR: [
              {
                title: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                content: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          take: 3,
          select: {
            id: true,
            title: true,
            content: true,
            source_type: true,
            metadata: true
          }
        });

        if (fallbackResults.length > 0) {
          const formattedResults = fallbackResults.map((doc, index) => {
            const metadata = doc.metadata as any;
            
            return `Result ${index + 1}:
Title: ${doc.title}
Source Type: ${doc.source_type}
Content: ${doc.content.substring(0, 300)}${doc.content.length > 300 ? '...' : ''}
${metadata?.tags ? `Tags: ${metadata.tags}` : ''}
---`;
          }).join('\n\n');

          return `Hippocampus Database Search Results for "${query}" (Fallback Text Search):\n\n${formattedResults}\n\nSource: Hippocampus Database, Text Search`;
        }

        return `Hippocampus Database Search Results for "${query}":\n\nNo documents found. Please ensure documents have been uploaded to the Hippocampus library.\n\nSource: Hippocampus Database`;
        
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        return `Hippocampus Database Search Error:\n\nUnable to search the database at this time. The system encountered an error while processing your query: "${query}".\n\nPlease try again later or contact support if the issue persists.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  },
  {
    name: 'search_hippocampus',
    description: 'Search the Hippocampus knowledge base for uploaded primary sources, PDF excerpts, corporate accountability records, and educational data.',
    schema: z.object({
      query: z.string().describe('The specific topic or keywords to search for in the vector database.'),
    }),
  }
);

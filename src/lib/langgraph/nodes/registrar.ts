import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { AdelineStateType } from "../state";
import { ChatOpenAI } from "@langchain/openai";
import { loadConfig, buildSystemPrompt } from '@/lib/config';
import prisma from "@/lib/db";
import { z } from "zod";

// Define the structured output schema
const CreditEvaluationSchema = z.object({
  subject: z.string().describe("The academic subject area"),
  credits: z.number().describe("Realistic credit amount (0.01-0.05 for daily tasks)"),
  educational_value: z.string().describe("Description of learning value"),
  estimated_hours: z.number().describe("Realistic time estimate for this single task"),
  activity_name: z.string().describe("Clear description of the activity")
});

export async function registrar(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = lastMessage.content as string;
  
  try {
    // Load Adeline's configuration
    const config = loadConfig();
    
    // Initialize LangChain ChatOpenAI model
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create the system prompt with grade-level awareness
    const systemPrompt = `You are Adeline's registrar, evaluating real-world learning activities for academic credits.

Student Grade Level: ${state.gradeLevel || '3'}

Evaluate the student's real-world activity. Determine the academic subject and educational value. CRITICAL MATH: 1.0 high school credit = 120 hours. Estimate the time this single task took. A 1-2 hour task MUST ONLY be awarded 0.01 to 0.02 credits.

Consider the student's grade level when determining educational value and complexity. Be conservative but fair with credit awards.

Return a JSON object with:
- subject: Academic subject area
- credits: Realistic credit amount (0.01-0.05 for daily tasks)
- educational_value: Description of learning value
- estimated_hours: Realistic time estimate for this single task  
- activity_name: Clear description of the activity

Examples:
- "I baked bread" → subject: "Chemistry", credits: 0.017, estimated_hours: 2
- "I fixed a bike" → subject: "Mechanical Engineering", credits: 0.025, estimated_hours: 3
- "I wrote a story" → subject: "English", credits: 0.015, estimated_hours: 1.5`;

    // Create the human prompt with the user's activity
    const humanPrompt = `Student reported: "${content}"

Please evaluate this activity and return the JSON object.`;

    // Use LangChain with structured output
    const chain = model.withStructuredOutput(CreditEvaluationSchema);
    const result = await chain.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ]);

    // Create the transcript entry
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: state.userId,
        activityName: result.activity_name,
        mappedSubject: result.subject,
        creditsEarned: result.credits,
        dateCompleted: new Date(),
        notes: `Student reported: ${content}. Educational value: ${result.educational_value}. Estimated time: ${result.estimated_hours} hours.`,
        metadata: {
          evidence: 'Student self-report',
          estimatedHours: result.estimated_hours,
          aiProcessed: true,
          gradeLevel: state.gradeLevel,
          llmEvaluated: true,
        },
      },
    });
    
    // Generate a warm response
    const responseText = `I've recorded your ${result.activity_name} activity. This demonstrates learning in ${result.subject} and earns ${result.credits.toFixed(3)} credits. ${result.educational_value} Every experience contributes to your educational journey.`;
    
    return {
      credit_entry: transcriptEntry,
      response_content: responseText,
      metadata: {
        ...state.metadata,
        registrar: {
          entry_id: transcriptEntry.id,
          activity: result.activity_name,
          subject: result.subject,
          credits_awarded: result.credits,
          estimated_hours: result.estimated_hours,
          grade_level: state.gradeLevel,
          llm_evaluated: true,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
  } catch (error) {
    console.error('Registrar error:', error);
    return {
      response_content: "I'm having trouble evaluating your achievement right now. Let me try again or help you in another way.",
      metadata: {
        ...state.metadata,
        registrar: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}

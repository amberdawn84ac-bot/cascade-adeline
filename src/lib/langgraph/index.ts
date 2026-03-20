import { StateGraph, START, END } from "@langchain/langgraph";
import { AdelineState, AdelineStateType } from "./state";
import { router } from "./nodes/router";
import { investigator } from "./nodes/investigator";
import { registrar } from "./nodes/registrar";
import { mentor } from "./nodes/mentor";
import { opportunityScout } from "./nodes/opportunityScout";
import { projectBrainstormer } from "./nodes/projectBrainstormer";
import { visionAnalyzer } from "./visionAnalyzer";
import { AdelineGraphState } from "./types";
import { gapDetector } from "./gapDetector";

// Wrapper function to bridge state types
async function visionAnalyzerWrapper(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  // Convert AdelineStateType to AdelineGraphState
  const graphState: AdelineGraphState = {
    userId: state.userId,
    gradeLevel: undefined, // Not available in AdelineStateType
    prompt: state.messages[state.messages.length - 1]?.content as string || '',
    metadata: state.metadata,
  };
  
  // Call the original visionAnalyzer
  const result = await visionAnalyzer(graphState);
  
  // Convert back to AdelineStateType
  return {
    response_content: result.responseContent,
    metadata: result.metadata,
  };
}

// Wrapper to bridge AdelineStateType → gapDetector (takes AdelineGraphState)
async function gapDetectorWrapper(state: AdelineStateType): Promise<Partial<AdelineStateType>> {
  const graphState: AdelineGraphState = {
    userId: state.userId,
    gradeLevel: state.gradeLevel,
    prompt: state.messages[state.messages.length - 1]?.content as string || '',
    metadata: state.metadata,
    studentContext: {
      interests: [],
      recentTranscripts: [],
      activeProjects: [],
      detectedGaps: [],
    },
  };

  const result = await gapDetector(graphState);

  return {
    learning_gaps: (result.metadata?.gapDetector as any)?.gaps?.map((g: string) => ({ subject: g })) || [],
    metadata: {
      ...state.metadata,
      gapDetector: result.metadata?.gapDetector,
      gapNudge: result.metadata?.gapNudge,
    },
  };
}

// Conditional routing function
function routeIntent(state: AdelineStateType): string {
  const intent = state.intent;
  console.log('[LangGraph] routeIntent called with intent:', intent);
  
  switch (intent) {
    case 'INVESTIGATE':
      console.log('[LangGraph] Routing to investigator');
      return 'investigator';
    case 'LOG_CREDIT':
      console.log('[LangGraph] Routing to registrar');
      return 'registrar';
    case 'REFLECT':
      console.log('[LangGraph] Routing to mentor');
      return 'mentor';
    case 'GEN_UI':
      console.log('[LangGraph] Routing to mentor for GEN_UI');
      return 'mentor'; // FIXED: GenUI should go to mentor for component generation
    case 'OPPORTUNITY':
      console.log('[LangGraph] Routing to opportunityScout');
      return 'opportunityScout';
    case 'BRAINSTORM':
      console.log('[LangGraph] Routing to projectBrainstormer');
      return 'projectBrainstormer';
    case 'IMAGE_LOG':
    case 'VISION':
      console.log('[LangGraph] Routing to visionAnalyzer');
      return 'visionAnalyzer';
    case 'CHAT':
    default:
      console.log('[LangGraph] Routing to mentor (default/CHAT)');
      return 'mentor';
  }
}

// Create the graph
export const adelineBrain = new StateGraph(AdelineState)
  // Add nodes
  .addNode("router", router)
  .addNode("investigator", investigator)
  .addNode("registrar", registrar)
  .addNode("mentor", mentor)
  .addNode("opportunityScout", opportunityScout)
  .addNode("projectBrainstormer", projectBrainstormer)
  .addNode("visionAnalyzer", visionAnalyzerWrapper)
  .addNode("gapDetector", gapDetectorWrapper)
  
  // Add edges
  .addEdge(START, "router")
  .addConditionalEdges(
    "router",
    routeIntent,
    {
      investigator: "investigator",
      registrar: "registrar",
      mentor: "mentor",
      opportunityScout: "opportunityScout",
      projectBrainstormer: "projectBrainstormer",
      visionAnalyzer: "visionAnalyzer",
    }
  )
  // All agents flow through gapDetector before ending
  .addEdge("investigator", "gapDetector")
  .addEdge("registrar", "gapDetector")
  .addEdge("mentor", "gapDetector")
  .addEdge("opportunityScout", "gapDetector")
  .addEdge("projectBrainstormer", "gapDetector")
  .addEdge("visionAnalyzer", "gapDetector")
  .addEdge("gapDetector", END)
  .compile();

// Export the runnable
export const adelineBrainRunnable = adelineBrain;


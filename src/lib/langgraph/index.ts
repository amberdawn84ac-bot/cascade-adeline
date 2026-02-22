import { StateGraph, START, END } from "@langchain/langgraph";
import { AdelineState, AdelineStateType } from "./state";
import { router } from "./nodes/router";
import { investigator } from "./nodes/investigator";
import { registrar } from "./nodes/registrar";
import { mentor } from "./nodes/mentor";

// Conditional routing function
function routeIntent(state: AdelineStateType): string {
  const intent = state.intent;
  
  switch (intent) {
    case 'INVESTIGATE':
      return 'investigator';
    case 'LOG_CREDIT':
      return 'registrar';
    case 'REFLECT':
      return 'mentor';
    case 'GEN_UI':
      return 'mentor'; // For now, route to mentor for GenUI requests
    case 'CHAT':
    default:
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
  
  // Add edges
  .addEdge(START, "router")
  .addConditionalEdges(
    "router",
    routeIntent,
    {
      investigator: "investigator",
      registrar: "registrar",
      mentor: "mentor",
    }
  )
  .addEdge("investigator", END)
  .addEdge("registrar", END)
  .addEdge("mentor", END)
  .compile();

// Export the runnable
export const adelineBrainRunnable = adelineBrain;

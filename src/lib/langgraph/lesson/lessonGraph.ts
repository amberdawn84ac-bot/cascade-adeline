import { StateGraph, START, END } from '@langchain/langgraph';
import { LessonState, LessonStateType } from './lessonState';
import { orchestrator } from './nodes/orchestrator';
import { architectAgent } from './nodes/architectAgent';
import { contentAgent } from './nodes/contentAgent';
import { sourceRetrieverAgent } from './nodes/sourceRetrieverAgent';
import { mediaAgent } from './nodes/mediaAgent';
import { assessmentAgent } from './nodes/assessmentAgent';
import { activityAgent } from './nodes/activityAgent';
import { personalizerAgent } from './nodes/personalizerAgent';

function routeAfterAssessment(state: LessonStateType): string {
  if (state.phase === 'remediation' && state.loopCount < 3) {
    return 'orchestrator';
  }
  return 'activityAgent';
}


export const lessonBrain = new StateGraph(LessonState)
  .addNode('orchestrator', orchestrator)
  .addNode('architectAgent', architectAgent)
  .addNode('contentAgent', contentAgent)
  .addNode('sourceRetrieverAgent', sourceRetrieverAgent)
  .addNode('mediaAgent', mediaAgent)
  .addNode('assessmentAgent', assessmentAgent)
  .addNode('activityAgent', activityAgent)
  .addNode('personalizerAgent', personalizerAgent)

  .addEdge(START, 'orchestrator')
  .addEdge('orchestrator', 'architectAgent')
  .addEdge('architectAgent', 'sourceRetrieverAgent')
  .addEdge('sourceRetrieverAgent', 'contentAgent')
  .addEdge('contentAgent', 'mediaAgent')
  .addEdge('mediaAgent', 'assessmentAgent')
  .addConditionalEdges('assessmentAgent', routeAfterAssessment, {
    orchestrator: 'orchestrator',
    activityAgent: 'activityAgent',
  })
  .addEdge('activityAgent', 'personalizerAgent')
  .addEdge('personalizerAgent', END)
  .compile();

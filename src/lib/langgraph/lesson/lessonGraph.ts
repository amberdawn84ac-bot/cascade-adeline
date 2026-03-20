import { StateGraph, START, END } from '@langchain/langgraph';
import { LessonState, LessonStateType } from './lessonState';
import { orchestrator } from './nodes/orchestrator';
import { contentAgent } from './nodes/contentAgent';
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

function routeAfterOrchestrator(state: LessonStateType): string {
  if (state.phase === 'remediation') {
    return 'contentAgent';
  }
  return 'contentAgent';
}

export const lessonBrain = new StateGraph(LessonState)
  .addNode('orchestrator', orchestrator)
  .addNode('contentAgent', contentAgent)
  .addNode('mediaAgent', mediaAgent)
  .addNode('assessmentAgent', assessmentAgent)
  .addNode('activityAgent', activityAgent)
  .addNode('personalizerAgent', personalizerAgent)

  .addEdge(START, 'orchestrator')
  .addConditionalEdges('orchestrator', routeAfterOrchestrator, {
    contentAgent: 'contentAgent',
  })
  .addEdge('contentAgent', 'mediaAgent')
  .addEdge('mediaAgent', 'assessmentAgent')
  .addConditionalEdges('assessmentAgent', routeAfterAssessment, {
    orchestrator: 'orchestrator',
    activityAgent: 'activityAgent',
  })
  .addEdge('activityAgent', 'personalizerAgent')
  .addEdge('personalizerAgent', END)
  .compile();

/**
 * Heuristic subject detection from free-text query — no LLM cost.
 * Shared by /api/chat/route.ts (LESSON branch) and /api/lessons/stream/route.ts.
 */
export function subjectFromQuery(query: string): string {
  const q = query.toLowerCase();
  if (/history|civil war|revolution|founding|war|empire|colonial|world war|slavery|amendment/.test(q)) return 'history';
  if (/science|biology|chemistry|physics|earth|ecology|botany|astronomy|genetics|cell/.test(q)) return 'science';
  if (/math|algebra|geometry|calculus|fraction|equation|arithmetic|statistics|number/.test(q)) return 'mathematics';
  if (/bible|scripture|proverb|psalm|genesis|gospel|faith|jesus|god|verse|theology/.test(q)) return 'bible';
  if (/english|writing|grammar|literature|reading|essay|poetry|novel|paragraph/.test(q)) return 'english';
  if (/art|drawing|painting|music|creative|design|sketch|compose/.test(q)) return 'fine-arts';
  if (/government|civics|politics|constitution|democracy|law|economics/.test(q)) return 'social-studies';
  return 'general';
}

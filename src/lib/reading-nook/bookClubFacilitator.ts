import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import prisma from '@/lib/db';
import { getStudentContext } from '@/lib/learning/student-context';

/**
 * Generates a Socratic, critical-thinking discussion question for a book club
 * using the student's grade level and interests, then inserts it as an Adeline post.
 *
 * @param userId    - ID of the student triggering the facilitation (used for context)
 * @param clubId    - Target BookClub ID
 * @param bookId    - Gutenberg book ID or slug (used to tailor the question)
 * @param chapter   - Optional chapter/section for specificity
 */
export async function generateBookClubPrompt(
  userId: string,
  clubId: string,
  bookId: string,
  chapter?: string
) {
  // 1. Fetch club info + student context in parallel
  const [club, studentCtx] = await Promise.all([
    prisma.bookClub.findUnique({
      where: { id: clubId },
      select: { bookTitle: true, name: true },
    }),
    getStudentContext(userId, { subjectArea: 'English Language Arts' }),
  ]);

  const bookTitle = club?.bookTitle ?? bookId;
  const grade = studentCtx.activeGradeLevel;
  const interests = studentCtx.interests.length > 0
    ? studentCtx.interests.slice(0, 3).join(', ')
    : 'nature, adventure, and real-world problem solving';

  const chapterRef = chapter ? ` (${chapter})` : '';

  // 2. Build the prompt
  const systemPrompt = `You are Adeline, a warm and intellectually sharp homeschool mentor. Your job is to spark genuine literary discussion among K-12 students by asking ONE powerful Socratic question. 

Rules:
- Ask exactly ONE open-ended question — no preamble, no multiple questions.
- The question must require the student to think critically about character motivation, theme, moral dilemma, or cause-and-effect — never a yes/no or recall question.
- Calibrate vocabulary and complexity strictly to grade ${grade}.
- Weave in connections to the student's interests: ${interests}.
- Keep it under 3 sentences total.
- Do NOT include phrases like "As Adeline, I want to ask..." — just ask the question directly, as a wise friend would.`;

  const userPrompt = `The book club is reading "${bookTitle}"${chapterRef}. Generate one Socratic discussion question for grade ${grade} students.`;

  // 3. Call the LLM
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 200,
  });

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ]);

  const content = typeof response.content === 'string'
    ? response.content.trim()
    : String(response.content);

  // 4. Insert as an Adeline post
  const post = await prisma.bookClubPost.create({
    data: {
      clubId,
      userId: null,
      isAdeline: true,
      content,
      chapter: chapter ?? null,
    },
    include: {
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  return post;
}

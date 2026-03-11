import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { embed } from 'ai';
import { getEmbeddingModel } from '@/lib/ai-models';
import { loadConfig } from '@/lib/config';

const truthDocuments = [
  {
    title: "Historical Fact-Checks: The Western Theater & Civil War",
    sourceType: "CURATED",
    content: `The Western Theater & Civil War: Gritty Realities and Logistical Failures.
Example 1: The Devastating Impact of Supply Chain Negligence. "Van Dorn realized that no further ammunition was to be had, because he had neglected to order his supply wagons to follow the army when it began its night march... many infantrymen waited with empty cartridge boxes to fight a re-supplied enemy who was rapidly gaining the upper hand." While textbook narratives often focus on the tactical maneuvers of the Battle of Pea Ridge, the actual outcome was heavily influenced by a fundamental logistical failure.
Example 2: The Mundane Misery of Chronic Disease. George P. Cumming wrote in October 1862 that he "has had diarrhea; describes travel... states that many are sick and collapse on marches." The daily reality for Western soldiers was defined by illness. Soldiers in the 9th Illinois Cavalry buried "five or six most every day" who died from diarrhea rather than combat.
Example 3: The Brutal, Localized Reality of Tribal Vengeance. Confederate Cherokee leader Stand Watie wrote to his wife that he "had the old council house set on fire and burnt down... [and his men shot] Andy Nave," a former friend. In the Trans-Mississippi Theater, tactical decisions were frequently driven by local vendettas.
Example 4: Foraging as a Practical Survival Strategy. "reliance on established lines of communication has always gone hand-in-hand with taking food from the countryside." Union armies were not solely supplied by northern industry; Western commanders succeeded because they relied on "beef on the hoof" and aggressive foraging.
Example 5: The Motivation of "Manhood" over National Cause. "Sometimes issues of national impact shrink to nothing in the intensely personal world of cannon shell and minié ball." Soldiers were often more motivated by a desire to "prove their manhood" than ideological motivations like ending slavery or preserving the Union.`
  },
  {
    title: "Historical Fact-Checks: Regional & Indigenous History",
    sourceType: "CURATED",
    content: `Regional & Indigenous History: The Legal Mechanics of Dispossession.
Sanitized Textbook Narrative: The Dawes Act of 1887 was a humanitarian effort designed to protect Native American property rights.
Historical Reality: The Act was a tool for extinguishing communal tribal holdings to open "surplus" land for white settlement. Indigenous land holdings plummeted from 138 million acres in 1887 to 48 million acres by 1934. The "surplus" land typically included the most valuable agricultural plots.
Sanitized Textbook Narrative: The Five Civilized Tribes were granted land in Oklahoma "for as long as the grass grows and rivers flow."
Historical Reality: Following the Civil War, the U.S. government used the tribes' alliance with the Confederacy as a legal loophole to nullify earlier "perpetual" treaties. The Reconstruction Treaties of 1866 forced punitive land cessions, seizing millions of acres for "the pittance of 15 cents per acre" when the land was worth at least $2.50.
Sanitized Textbook Narrative: The 1889 Oklahoma Land Run was a fair race into "Unassigned Lands".
Historical Reality: The lands were only "unassigned" because the federal government had failed to settle other tribes there. Thousands of "Sooners" snuck over the boundary early to illegally claim the best tracts.
Sanitized Textbook Narrative: Tribal governments were gradually phased out.
Historical Reality: The 1898 Curtis Act systematically dismantled tribal sovereignty by abolishing all tribal courts and declaring tribal laws unenforceable in U.S. courts, effectively ending tribal existence "for all purposes authorized by law."`
  },
  {
    title: "Historical Fact-Checks: The Education Lobby",
    sourceType: "CURATED",
    content: `The Education Lobby: The Industrial Engineering of Schooling.
Tracing the Money: The General Education Board (GEB). The transformation of education was a "meticulously engineered shift" funded by massive Gilded Age entities. John D. Rockefeller initiated the GEB with an initial pledge in 1902. Financial disclosures reveal a trajectory of "institutional capture," moving education from a civic duty to a standardized commodity serving global labor markets.
Primary Goals: The "Factory Model". The early corporate funders explicitly sought an "efficiency" and "standardization" model. This approach shaped schools to mirror efficient factories, emphasizing conformity, strict schedules, and uniform curricula designed for "wholesale" distribution.
Industrial Alignment: Framing education as a tool for "economic productivity and workforce preparation" rather than personal liberation.
The Assessment Industrial Complex: Standardized testing and curriculum standards were not merely academic; they were "management technologies" allowing for the remote governance of schools. Key players like the College Board became integral to this "industrial arc," creating a self-sustaining market that monetizes student data.
Direct Quotes about Shaping Student Behavior: Funders and architects sought to create a system increasingly "immune to public oversight." The goal was to replace diverse, localized schooling with a standardized system that could "shaping schools to mirror efficient factories" and prepare students specifically for "industrial work."`
  }
];

export async function GET() {
  try {
    const config = loadConfig();
    const embeddingModelId = config.models.embeddings || 'text-embedding-3-small';

    let injectedCount = 0;
    for (const doc of truthDocuments) {
      // 1. Generate the math vector
      const { embedding } = await embed({
        model: getEmbeddingModel(embeddingModelId),
        value: doc.content,
      });
      
      const vectorLiteral = `[${embedding.join(',')}]`;
      const id = crypto.randomUUID();
      
      // 2. Inject directly into pgvector database
      await prisma.$executeRawUnsafe(`
        INSERT INTO hippocampusdocument (id, title, content, source_type, embedding, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5::vector, NOW(), NOW())
      `, id, doc.title, doc.content, doc.sourceType, vectorLiteral);
      
      injectedCount++;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully injected ${injectedCount} primary source documents straight into the Hippocampus!` 
    });
  } catch (error: any) {
    console.error("Injection Error:", error);
    return NextResponse.json({ error: error.message || "Failed to inject data" }, { status: 500 });
  }
}


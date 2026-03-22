import { ingestPrimarySource } from './ingest';
import type { IngestPrimarySourceInput } from './types';

const SOURCES: IngestPrimarySourceInput[] = [
  {
    title: 'Dawes Act Section 5 — The Surplus Land Clause (1887)',
    content: `SEC. 5. That upon the approval of the allotments provided for in this act by the Secretary of the Interior, he shall cause patents to issue therefor in the name of the allottees, which patents shall be of the legal effect, and declare that the United States holds the land thus allotted, for the period of twenty-five years, in trust for the sole use and benefit of the Indian to whom such allotment shall have been made... And if any conveyance shall be made of the lands set apart and allotted as herein provided, or any contract made touching the same, before the expiration of the time above mentioned, such conveyance shall be absolutely null and void... That at the expiration of said period of twenty-five years, or at any time during said period, the President of the United States may in his discretion extend the time... the Secretary of the Interior may negotiate with any Indian tribe... for the purchase and release by said tribe, in conformity with the treaty or statute under which such reservation is held, of such portions of its reservation not allotted as aforesaid as such tribe shall, from time to time, consent to sell, on such terms and conditions as shall be considered just and equitable between the United States and said tribe of Indians... and such lands as may be acquired from said tribe shall be opened to settlement...`,
    metadata: {
      sourceSlug: 'dawes-act-section-5-1887',
      creator: 'U.S. Congress',
      date: '1887-02-08',
      collection: 'National Archives',
      url: 'https://www.archives.gov/milestone-documents/dawes-act',
      rights: 'public_domain',
      topics: ['Dawes Act', 'Native American', 'land allotment', 'Oklahoma', 'surplus land'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'government-economics', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['follow-the-money', 'document-analysis', 'propaganda-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Leviticus 25:23', connection: 'God declares land cannot be permanently sold — the Dawes Act did the opposite' }],
      contentWarnings: [],
      investigationPrompts: ['What does "surplus" mean here — surplus to whom?', 'Who gets to settle the land "purchased" from tribes?', 'The government holds land "in trust" — who actually controls it?'],
      citation: 'Dawes Act (General Allotment Act), 24 Stat. 388 (1887). National Archives.',
    },
  },
  {
    title: 'John Burnett\'s Eyewitness Account of the Trail of Tears (1890)',
    content: `Murder is murder whether committed by the villain skulking in the dark or by uniformed men stepping to the strains of martial music. Murder is murder, and somebody must answer. Somebody must explain the streams of blood that flowed in the Indian country in the summer of 1838. Somebody must explain the 4,000 silent graves that mark the trail of the Cherokees to their exile. I wish I could forget it all, but the picture of 645 wagons lumbering over the frozen ground with their cargo of suffering humanity still lingers in my memory... In the chill of a drizzling rain on an October morning I saw them loaded like cattle or sheep into 645 wagons and started toward the west... On the morning of November the 17th we encountered a terrific sleet and snow storm with freezing temperatures and from that day until we reached the end of the fateful journey on March the 26th 1839, the sufferings of the Cherokees were awful. The trail of the exiles was a trail of death. They had to sleep in the wagons and on the ground without fire... I have held the children of John Ross... I saw the helpless Cherokees arrested and dragged from their homes, and driven at the bayonet point into the stockades... Chief John Ross wept as he said farewell to his people at the Hiwassee River.`,
    metadata: {
      sourceSlug: 'burnett-trail-of-tears-1890',
      creator: 'Private John Burnett, U.S. Army soldier, 2nd Regiment, 2nd Brigade, Mounted Infantry',
      date: '1890-12-11',
      collection: 'Cherokee Heritage Center Archives',
      rights: 'public_domain',
      topics: ['Trail of Tears', 'Cherokee removal', 'Indian Removal Act', 'Oklahoma', 'genocide'],
      era: 'early-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '6-12',
      investigationTypes: ['compare-sources', 'propaganda-analysis'],
      narrativeRole: 'eyewitness',
      scriptureConnections: [{ passage: 'Proverbs 22:22-23', connection: 'The LORD will plead the cause of those robbed by the powerful' }],
      contentWarnings: ['death', 'forced displacement', 'suffering'],
      investigationPrompts: ['Burnett was a U.S. soldier who followed orders — what does it mean that even he called it murder?', 'The official narrative called removal "civilizing." What does this eyewitness say?', 'Burnett waited 50 years to write this — why do you think that is?'],
      citation: 'Burnett, John. "The Cherokee Removal Through the Eyes of a Private Soldier." December 11, 1890. Oral history written on his 80th birthday.',
    },
  },
  {
    title: 'President Andrew Jackson\'s Address to Congress Justifying Indian Removal (1830)',
    content: `It gives me pleasure to announce to Congress that the benevolent policy of the Government, steadily pursued for nearly thirty years, in relation to the removal of the Indians beyond the white settlements is approaching to a happy consummation... The waves of population and civilization are rolling to the westward, and we now propose to acquire the countries occupied by the red men of the South and West by a fair exchange... Doubtless it will be painful to leave the graves of their fathers; but what do they more than our ancestors did or than our children are now doing? To better their condition in an unknown land our forefathers left all that was dear in earthly objects... and is it supposed that the wandering savage has a stronger attachment to his home than the settled, civilized Christian? How many thousands of our own people would gladly embrace the opportunity of removing to the West on such conditions! If the offers made to the Indians were extended to them, they would be hailed with gratitude and joy... Humanity has often wept over the fate of the aborigines of this country, and Philanthropy has been busily employed in devising means to avert it, but its progress has never for a moment been arrested, and one by one have many powerful tribes disappeared from the earth.`,
    metadata: {
      sourceSlug: 'jackson-indian-removal-address-1830',
      creator: 'President Andrew Jackson',
      date: '1830-12-06',
      collection: 'Congressional Record / Library of Congress',
      url: 'https://www.loc.gov/resource/llst.021/?sp=1',
      rights: 'public_domain',
      topics: ['Indian Removal Act', 'Andrew Jackson', 'Cherokee', 'propaganda', 'manifest destiny'],
      era: 'early-19th-century',
      subjectTracks: ['truth-based-history', 'government-economics', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'compare-sources'],
      narrativeRole: 'official_claim',
      scriptureConnections: [{ passage: 'Isaiah 10:1-2', connection: 'Woe to those who make unjust laws to deprive the poor of their rights' }],
      contentWarnings: [],
      investigationPrompts: ['Jackson calls removal "benevolent" and compares Cherokee attachment to land as less than a "settled Christian." What assumptions does this reveal?', 'He says tribes are "disappearing" as if it is natural — what does Burnett\'s account tell us is actually happening?', 'Who benefits from this narrative being accepted as truth?'],
      citation: 'Jackson, Andrew. Second Annual Message to Congress. December 6, 1830. Library of Congress.',
    },
  },
  {
    title: 'U.S. Committee on Public Information — "Why We Are Fighting" (1917)',
    content: `This war is not a war of governments. It is a war of peoples... The German government deliberately planned this war... planned it for thirty years. Germany deliberately deceived the whole world. She talked peace while she prepared the mightiest engine of war the world had ever seen. She signed treaties and broke them. She signed the Hague conventions and tore them up... America entered the war because Germany deliberately chose to make us her enemy. Germany sank our ships. Germany killed our citizens. Germany plotted revolution in our country. Germany used the mails to spread treachery among our people... We are fighting to make the world safe for democracy. We are fighting for the right of small nations to govern themselves. We are fighting to end Prussian militarism — the doctrine that the strong have the right to conquer the weak... Every man, woman, and child in America has a part to play in this great struggle. The slacker, the man who will not work or will not fight, has no place in this democracy.`,
    metadata: {
      sourceSlug: 'creel-committee-why-we-are-fighting-1917',
      creator: 'Committee on Public Information (Creel Committee), U.S. Government',
      date: '1917',
      collection: 'National Archives — World War I Records',
      rights: 'public_domain',
      topics: ['WWI', 'propaganda', 'Committee on Public Information', 'war', 'nationalism'],
      era: 'early-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'follow-the-money'],
      narrativeRole: 'propagandist',
      scriptureConnections: [{ passage: 'Matthew 23:27-28', connection: 'Appearing righteous while concealing what is actually inside' }],
      contentWarnings: [],
      investigationPrompts: ['Count the emotional triggers in this document — fear, duty, shame. How many can you find?', 'The Creel Committee was created by Congress to manufacture public consent for war. Who funded it?', 'What economic interests did U.S. banks and munitions manufacturers have in Britain\'s victory?'],
      citation: 'Committee on Public Information. "Why We Are Fighting." War Information Series No. 2. Washington, D.C., 1917.',
    },
  },
  {
    title: 'Robert McNamara\'s Admission: The Gulf of Tonkin Incident Was Fabricated (1995)',
    content: `We of the Kennedy and Johnson administrations who participated in the decisions on Vietnam acted according to what we thought were the principles and traditions of this nation. We made our decisions in light of those values. Yet we were wrong, terribly wrong. We owe it to future generations to explain why... I had never seen the classified cables that led President Johnson to ask Congress for the Gulf of Tonkin Resolution in August 1964... In retrospect, the incident was at most a misunderstanding, and may never have happened at all. The second attack simply did not occur... At the time, many of us in the administration believed it had. Looking back now, I know it did not. We were wrong. And on the basis of that wrong information, we sent 58,000 Americans to die and killed as many as 3 million Vietnamese... I truly believe that we made an honest mistake — but that does not matter. Good intentions were not good enough. We failed, and in doing so we caused untold human misery... It is important that we learn from our mistakes.`,
    metadata: {
      sourceSlug: 'mcnamara-tonkin-admission-1995',
      creator: 'Robert S. McNamara, former U.S. Secretary of Defense',
      date: '1995',
      collection: 'In Retrospect: The Tragedy and Lessons of Vietnam (1995)',
      rights: 'fair_use',
      topics: ['Vietnam War', 'Gulf of Tonkin', 'propaganda', 'government deception', 'Cold War'],
      era: 'late-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'compare-sources'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Proverbs 12:17', connection: 'An honest witness tells the truth — McNamara took 30 years' }],
      contentWarnings: ['war deaths', 'government deception'],
      investigationPrompts: ['McNamara says "good intentions were not good enough" — do you accept that as sufficient accountability?', 'If the Gulf of Tonkin attack didn\'t happen, what was the real reason the U.S. escalated in Vietnam?', 'Congress authorized war on the basis of false information. Who should be held responsible?'],
      citation: 'McNamara, Robert S. In Retrospect: The Tragedy and Lessons of Vietnam. Random House, 1995.',
    },
  },
  {
    title: 'Frederick Douglass — "What to the Slave is the Fourth of July?" (1852)',
    content: `Fellow-citizens, pardon me, allow me to ask, why am I called upon to speak here to-day? What have I, or those I represent, to do with your national independence? Are the great principles of political freedom and of natural justice, embodied in that Declaration of Independence, extended to us? And am I, therefore, called upon to bring our humble offering to the national altar, and to confess the benefits and express devout gratitude for the blessings resulting from your independence to us? I am not included within the pale of this glorious anniversary! Your high independence only reveals the immeasurable distance between us. The blessings in which you, this day, rejoice, are not enjoyed in common. The rich inheritance of justice, liberty, prosperity and independence, bequeathed by your fathers, is shared by you, not by me. The sunlight that brought life and healing to you has brought stripes and death to me. This Fourth July is yours, not mine. You may rejoice, I must mourn...

What, to the American slave, is your 4th of July? I answer: a day that reveals to him, more than all other days in the year, the gross injustice and cruelty to which he is the constant victim. To him, your celebration is a sham; your boasted liberty, an unholy license; your national greatness, swelling vanity; your sounds of rejoicing are empty and heartless; your denunciations of tyrants, brass fronted impudence; your shouts of liberty and equality, hollow mockery.`,
    metadata: {
      sourceSlug: 'douglass-fourth-of-july-1852',
      creator: 'Frederick Douglass',
      date: '1852-07-05',
      collection: 'Library of Congress — Frederick Douglass Papers',
      url: 'https://www.loc.gov/item/mfd.22020/',
      rights: 'public_domain',
      topics: ['slavery', 'Fourth of July', 'independence', 'hypocrisy', 'civil rights', 'Frederick Douglass'],
      era: 'mid-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'english-literature'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'compare-sources'],
      narrativeRole: 'victim_testimony',
      scriptureConnections: [{ passage: 'Amos 5:21-24', connection: 'God says He hates religious festivals of those who oppress the poor — let justice roll down like water' }],
      contentWarnings: [],
      investigationPrompts: ['Douglass was invited to give a patriotic speech on July 5th — why did he give this speech instead?', 'The Declaration of Independence says "all men are created equal." How does Douglass expose the gap between the words and the reality?', 'This speech was called treasonous by some. Others called it the greatest American speech ever given. What does your reaction tell you about your own beliefs?'],
      citation: 'Douglass, Frederick. "What to the Slave is the Fourth of July?" Speech delivered at Rochester, New York, July 5, 1852. Library of Congress.',
    },
  },
  {
    title: 'Bartolomé de las Casas — Account of Columbus\'s Treatment of the Taíno (1542)',
    content: `Into this island, and into all the others of these Indies, the Spaniards entered with such force, such violence and cruelty, killing them, burning them, butchering them, afflicting them, tormenting them, and destroying them by novel kinds of cruelty never before seen or heard of or read of, that of all the infinite multitude of people who have inhabited these islands from the beginning of the world until now, I believe that not one third remain. And truly, of the more than a million persons who inhabited Hispaniola, and whom I myself saw, today there are no more than two hundred of the native people. The island of Cuba is almost completely depopulated, and the same is true of the islands of San Juan [Puerto Rico]...

All of this I saw with my own eyes. And because such innumerable multitude of human souls—all of whom had souls as precious as our own—were perishing without the Faith or knowledge of God and without the benefit of the sacraments, and this was happening on account of the tyranny and cruelty of the Spaniards, I resolved to persuade them to desist from such evil-doing. But they paid no more attention to my arguments than if I were a wall.`,
    metadata: {
      sourceSlug: 'las-casas-destruction-of-indies-1542',
      creator: 'Bartolomé de las Casas, Spanish priest and historian',
      date: '1542',
      collection: 'Library of Congress / Internet Archive',
      rights: 'public_domain',
      topics: ['Columbus', 'Taíno', 'Spanish colonization', 'genocide', 'manifest destiny', 'discovery narrative'],
      era: '16th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'compare-sources', 'document-analysis'],
      narrativeRole: 'eyewitness',
      scriptureConnections: [{ passage: 'Genesis 1:27', connection: 'All humans made in the image of God — las Casas appealed to this when the conquistadors denied Taíno humanity' }],
      contentWarnings: ['genocide', 'violence', 'colonial atrocity'],
      investigationPrompts: ['Columbus\'s journal calls the Taíno "gentle" and says they would make "good servants." De las Casas says he personally witnessed a million people reduced to two hundred. How did the narrative in American textbooks develop?', 'De las Casas was a SPANISH PRIEST writing to the Spanish king. Why would he risk his safety to write this?', 'Columbus Day celebrates "discovery" — discovery for whom?'],
      citation: 'de las Casas, Bartolomé. A Short Account of the Destruction of the Indies. 1542. Trans. Nigel Griffin. Penguin Classics, 1992.',
    },
  },
  {
    title: 'Executive Order 9066 — Japanese American Internment (1942)',
    content: `WHEREAS the successful prosecution of the war requires every possible protection against espionage and against sabotage to national-defense material, national-defense premises, and national-defense utilities...

NOW, THEREFORE, by virtue of the authority vested in me as President of the United States, and Commander in Chief of the Army and Navy, I hereby authorize and direct the Secretary of War, and the Military Commanders whom he may from time to time designate, whenever he or any designated Commander deems such action necessary or desirable, to prescribe military areas in such places and of such extent as he or the appropriate Military Commander may determine, from which any or all persons may be excluded, and with respect to which, the right of any person to enter, remain in, or leave shall be subject to whatever restrictions the Secretary of War or the appropriate Military Commander may impose in his discretion.`,
    metadata: {
      sourceSlug: 'executive-order-9066-internment-1942',
      creator: 'President Franklin D. Roosevelt',
      date: '1942-02-19',
      collection: 'National Archives',
      url: 'https://www.archives.gov/milestone-documents/executive-order-9066',
      rights: 'public_domain',
      topics: ['Japanese internment', 'WWII', 'civil liberties', 'racism', 'government power', 'propaganda'],
      era: 'mid-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'document-analysis', 'follow-the-money'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Isaiah 10:1-2', connection: 'Woe to those who issue oppressive decrees that deprive the innocent of their rights' }],
      contentWarnings: ['racism', 'civil rights violations'],
      investigationPrompts: ['The order never says "Japanese Americans" — it says "any persons." But 120,000 Japanese Americans were interned while German Americans and Italian Americans were not. What explains this?', 'Fred Korematsu refused to comply and went to the Supreme Court. He lost in 1944. In 1983 his conviction was overturned. What changed?', 'Japanese American farmers owned valuable agricultural land in California. Who bought it for pennies when they were forced to leave?'],
      citation: 'Executive Order 9066. February 19, 1942. President Franklin D. Roosevelt. National Archives.',
    },
  },
  {
    title: 'Triangle Shirtwaist Fire — Survivors\' Testimony Before the Factory Investigating Commission (1911)',
    content: `TESTIMONY OF ROSA MALTESE: I was employed at the Triangle Waist Company on the eighth floor. We heard screams from the floor above. We tried the stairway door but it was locked. We went to the windows. Some of the girls jumped. I saw them fall. The fire escape was already crowded and it pulled away from the wall. The foreman had the key to the stairway door. He left by that door himself but did not unlock it for us. We had to go to the windows. I do not know how many died on my floor.

TESTIMONY OF PAULINE PEPE: Mr. Bernstein had two doors he kept locked to prevent us from taking breaks or leaving the floor without permission. We worked 14-hour days for $6 a week. I was 16 years old. The windows were our only escape. Many girls could not fit through and were burned. The owners, Harris and Blanck, had the same fire the previous year and collected insurance. After this fire they collected insurance again and were charged with manslaughter. They were acquitted. Mr. Blanck was arrested two years later for again locking his factory doors during working hours. He was fined $20.`,
    metadata: {
      sourceSlug: 'triangle-shirtwaist-testimony-1911',
      creator: 'Survivors Rosa Maltese and Pauline Pepe, New York Factory Investigating Commission',
      date: '1911',
      collection: 'New York State Archives — Factory Investigating Commission Transcripts',
      rights: 'public_domain',
      topics: ['Triangle Shirtwaist Fire', 'labor rights', 'industrial revolution', 'workers rights', 'immigration'],
      era: 'early-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics', 'justice-changemaking'],
      readingLevel: '6-12',
      investigationTypes: ['follow-the-money', 'document-analysis'],
      narrativeRole: 'victim_testimony',
      scriptureConnections: [{ passage: 'James 5:4', connection: 'The wages you failed to pay your workers cry out — the Lord Almighty has heard their cry' }],
      contentWarnings: ['death', 'workplace exploitation'],
      investigationPrompts: ['The owners were acquitted of manslaughter despite locked doors. Follow the money — who were Harris and Blanck?', 'The owners collected insurance twice. The fine for locking doors was $20. What does this tell you about whose lives the law protected?', 'This fire directly led to the creation of labor laws. Why did it take 146 deaths to protect workers who were already being exploited?'],
      citation: 'New York Factory Investigating Commission. Public Hearings. 1911. New York State Archives.',
    },
  },
  {
    title: 'COINTELPRO: FBI Memo on Martin Luther King Jr. — "The Most Dangerous Negro" (1963)',
    content: `AIRTEL — TO: SAC, ATLANTA — FROM: DIRECTOR, FBI — SUBJECT: COMMUNIST PARTY USA — NEGRO QUESTION — INTERNAL SECURITY

In the light of King's powerful demagogic speech on August 28 [March on Washington, "I Have a Dream"], he stands head and shoulders over all other Negro leaders put together when it comes to influencing great masses of Negroes. We must mark him now, if we have not before, as the most dangerous Negro in America from the standpoint of communism, the Negro, and national security... It may be unrealistic to limit our activities to legalistic proofs that would stand up in court or to proceedings before Congressional Committees.

[1964 memo to field offices]: The purpose of this new endeavor is to expose, disrupt, misdirect, discredit, or otherwise neutralize the activities of black nationalist, hate-type organizations and groupings, their leadership, spokesmen, membership, and supporters...`,
    metadata: {
      sourceSlug: 'cointelpro-fbi-mlk-most-dangerous-negro-1963',
      creator: 'Federal Bureau of Investigation, Director J. Edgar Hoover',
      date: '1963-08-30',
      collection: 'FBI COINTELPRO Files — Declassified via Church Committee (1975)',
      url: 'https://vault.fbi.gov/cointel-pro',
      rights: 'public_domain',
      topics: ['COINTELPRO', 'Martin Luther King', 'FBI', 'civil rights', 'government surveillance', 'propaganda'],
      era: 'mid-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'follow-the-money', 'document-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Amos 5:10', connection: 'They hate the one who rebukes in the gate, and despise the one who tells the truth' }],
      contentWarnings: ['racial slurs in original document', 'government persecution'],
      investigationPrompts: ['Dr. King is now celebrated with a national holiday. But while he was alive, the FBI called him "the most dangerous Negro in America." What does this gap tell you about how governments treat reformers?', 'COINTELPRO targeted not just MLK but anti-war activists, feminist groups, and Native American movements. Who decides which movements get labeled "dangerous"?', 'This document was SECRET until the Church Committee forced its release in 1975. What else might still be classified?'],
      citation: 'Federal Bureau of Investigation. COINTELPRO Files. Declassified 1971-1975. Available at FBI Vault: vault.fbi.gov.',
    },
  },
  {
    title: 'Leviticus 25:23 — The Land Belongs to God',
    content: `The land shall not be sold in perpetuity, for the land is mine. For you are strangers and sojourners with me. And in all the country you possess, you shall allow a redemption of the land. If your brother becomes poor and sells part of his property, then his nearest redeemer shall come and redeem what his brother has sold. If a man has no one to redeem it and then himself becomes prosperous and finds sufficient means to redeem it, let him calculate the years since he sold it and pay back the balance to the man to whom he sold it, and then return to his property. But if he has not sufficient means to recover it, then what he sold shall remain in the hand of the buyer until the year of jubilee. In the jubilee it shall be released, and he shall return to his property. — Leviticus 25:23-28 (ESV)`,
    metadata: {
      sourceSlug: 'leviticus-25-23-land-belongs-to-god',
      creator: 'Scripture — Torah / Old Testament',
      date: 'ancient',
      collection: 'Holy Bible, ESV',
      rights: 'public_domain',
      topics: ['land stewardship', 'jubilee', 'justice', 'property', 'scripture'],
      era: 'ancient',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'discipleship-cultural-discernment'],
      readingLevel: '6-12',
      investigationTypes: ['compare-sources', 'document-analysis'],
      narrativeRole: 'scripture',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: ['The Dawes Act claimed to bring civilization to Native Americans. How does God\'s law about land compare to what the U.S. government did?', 'The Year of Jubilee meant all land returned to original families every 50 years. No permanent dispossession. How different is this from history?'],
      citation: 'The Holy Bible, English Standard Version. Leviticus 25:23-28. Crossway Bibles, 2001.',
    },
  },
  {
    title: 'Abraham Lincoln — Letter to Horace Greeley: "The Great Object Is to Save the Union" (1862)',
    content: `If there be those who would not save the Union, unless they could at the same time save slavery, I do not agree with them. If there be those who would not save the Union unless they could at the same time destroy slavery, I do not agree with them. My paramount object in this struggle is to save the Union, and is not either to save or to destroy slavery. If I could save the Union without freeing any slave I would do it, and if I could save it by freeing all the slaves I would do that. What I do about slavery, and the colored race, I do because I believe it helps to save the Union; and what I forbear, I forbear because I do not believe it would help to save the Union. I shall do less whenever I shall believe what I am doing hurts the cause, and I shall do more whenever I shall believe doing more will help the cause. I shall try to correct errors when shown to be errors; and I shall adopt new views so fast as they shall appear to be true views. I have here stated my purpose according to my view of official duty; and I intend no modification of my oft-expressed personal wish that all men every where could be free.`,
    metadata: {
      sourceSlug: 'lincoln-greeley-letter-1862',
      creator: 'President Abraham Lincoln',
      date: '1862-08-22',
      collection: 'New York Tribune / Library of Congress',
      url: 'https://www.loc.gov/resource/mal.4233400/',
      rights: 'public_domain',
      topics: ['Civil War', 'Emancipation', 'Lincoln', 'slavery', 'Union'],
      era: 'mid-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'compare-sources'],
      narrativeRole: 'government_record',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Lincoln wrote this letter one month before issuing the Emancipation Proclamation. Was freeing slaves his primary motive?',
        'Textbooks often present Lincoln as "The Great Emancipator." How does his own writing complicate that story?',
        'Who benefits from the simpler narrative of Lincoln as moral hero rather than pragmatic politician?',
      ],
      citation: 'Lincoln, Abraham. Letter to Horace Greeley. August 22, 1862. Library of Congress, Abraham Lincoln Papers.',
    },
  },
  {
    title: '13th Amendment to the U.S. Constitution — The Exception Clause (1865)',
    content: `SECTION 1. Neither slavery nor involuntary servitude, except as a punishment for crime whereof the party shall have been duly convicted, shall exist within the United States, or any place subject to their jurisdiction.

SECTION 2. Congress shall have power to enforce this article by appropriate legislation.

[Context: Within months of ratification, Southern states enacted Black Codes and began convicting freed Black men of vague "crimes" such as vagrancy (being unemployed), loitering, or failing to sign annual labor contracts. Convicted men were leased to private companies — mines, railroads, farms — in a system that functioned as forced labor. By 1898, 73% of Alabama's entire state revenue came from convict leasing. The 13th Amendment's exception clause was the legal foundation.]`,
    metadata: {
      sourceSlug: '13th-amendment-exception-clause-1865',
      creator: 'U.S. Congress',
      date: '1865-12-06',
      collection: 'National Archives',
      url: 'https://www.archives.gov/milestone-documents/13th-amendment',
      rights: 'public_domain',
      topics: ['13th Amendment', 'slavery', 'convict leasing', 'Reconstruction', 'Black Codes', 'prison labor'],
      era: 'mid-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'government-economics'],
      readingLevel: '6-12',
      investigationTypes: ['document-analysis', 'follow-the-money', 'propaganda-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Leviticus 19:13', connection: 'Do not hold back the wages of a hired worker overnight — convict leasing violated this principle daily' }],
      contentWarnings: [],
      investigationPrompts: [
        'The amendment "abolished" slavery but included an exception. Who wrote that exception and why?',
        'Within a year, Southern prisons went from nearly empty to overflowing with Black men convicted of "vagrancy." Does this seem like coincidence?',
        'Today the U.S. has more incarcerated people than any country in history, and prison labor is still legal. Is the exception clause still relevant?',
      ],
      citation: '13th Amendment to the U.S. Constitution. Ratified December 6, 1865. National Archives.',
    },
  },
  {
    title: 'Mississippi Black Codes — "An Act to Confer Civil Rights on Freedmen" (1865)',
    content: `SECTION 1. All freedmen, free negroes and mulattoes may sue and be sued... have personal property... Provided, That the provisions of this section shall not be so construed as to allow any freedman, free negro or mulatto to rent or lease any lands or tenements except in incorporated cities or towns...

SECTION 2. All freedmen, free negroes and mulattoes in this State, over the age of eighteen years, found on the second Monday in January, 1866, or thereafter, with no lawful employment or business, or found unlawfully assembling themselves together... shall be deemed vagrants, and on conviction thereof shall be fined in a sum not exceeding, in the case of a freedman, free negro or mulatto, fifty dollars, and imprisoned...

SECTION 3. If any freedman, free negro, or mulatto, convicted of any of the above crimes, shall fail or refuse for five days after conviction to pay the fine and costs imposed, such person shall be hired out by the sheriff... to any white person who will pay said fine and costs, and take said convict for the shortest time.`,
    metadata: {
      sourceSlug: 'mississippi-black-codes-1865',
      creator: 'Mississippi State Legislature',
      date: '1865-11-25',
      collection: 'Mississippi Department of Archives and History',
      rights: 'public_domain',
      topics: ['Black Codes', 'Reconstruction', 'slavery', 'convict leasing', 'Civil War aftermath'],
      era: 'mid-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['document-analysis', 'follow-the-money', 'propaganda-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Isaiah 10:1-2', connection: 'Woe to those who make unjust laws to deprive the poor of their rights' }],
      contentWarnings: ['racial terminology of the period'],
      investigationPrompts: [
        'The Civil War ended in April 1865. These Black Codes were passed in November 1865 — seven months later. What does the speed of this response tell you?',
        'The law is called "An Act to Confer Civil Rights on Freedmen." What civil rights does it actually confer vs. what rights does it restrict?',
        'Section 3 allows a convicted "vagrant" to be hired out to any white person. How is this different from slavery?',
      ],
      citation: 'Mississippi State Legislature. Laws of Mississippi. November 1865. Mississippi Department of Archives and History.',
    },
  },
  {
    title: 'Plessy v. Ferguson — Supreme Court Majority Opinion (1896)',
    content: `We consider the underlying fallacy of the plaintiff's argument to consist in the assumption that the enforced separation of the two races stamps the colored race with a badge of inferiority. If this be so, it is not by reason of anything found in the act, but solely because the colored race chooses to put that construction upon it... Legislation is powerless to eradicate racial instincts or to abolish distinctions based upon physical differences, and the attempt to do so can only result in accentuating the difficulties of the present situation. If the civil and political rights of both races be equal, one cannot be inferior to the other civilly or politically. If one race be inferior to the other socially, the Constitution of the United States cannot put them upon the same plane... The judgment of the court below is, therefore, affirmed.

[Justice Henry Billings Brown, writing for a 7-1 majority]`,
    metadata: {
      sourceSlug: 'plessy-v-ferguson-majority-1896',
      creator: 'U.S. Supreme Court — Justice Henry Billings Brown',
      date: '1896-05-18',
      collection: 'National Archives — U.S. Supreme Court Records',
      url: 'https://www.loc.gov/item/usrep163537/',
      rights: 'public_domain',
      topics: ['Plessy v. Ferguson', 'segregation', 'separate but equal', 'Jim Crow', 'Supreme Court'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['document-analysis', 'propaganda-analysis', 'compare-sources'],
      narrativeRole: 'official_claim',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'The Court says segregation doesn\'t stamp a "badge of inferiority" — it\'s just how Black people "choose to construct it." What does this tell you about whose reality the law was written to reflect?',
        'This decision was 7-1. Who was the one dissenter, and what did he say?',
        'Plessy v. Ferguson was the law for 58 years (1896–1954). What happened in those 58 years under "separate but equal"?',
      ],
      citation: 'Plessy v. Ferguson, 163 U.S. 537 (1896). U.S. Supreme Court.',
    },
  },
  {
    title: 'Plessy v. Ferguson — Justice Harlan\'s Lone Dissent (1896)',
    content: `In respect of civil rights, common to all citizens, the Constitution of the United States does not, I think, permit any public authority to know the race of those entitled to be protected in the enjoyment of such rights... Our Constitution is color-blind, and neither knows nor tolerates classes among citizens. In respect of civil rights, all citizens are equal before the law. The humblest is the peer of the most powerful. The law regards man as man, and takes no account of his surroundings or of his color when his civil rights as guaranteed by the supreme law of the land are involved...

The present decision, it may well be apprehended, will not only stimulate aggressions, more or less brutal and irritating, upon the admitted rights of colored citizens, but will encourage the belief that it is possible, by means of state enactments, to defeat the beneficent purposes which the people of the United States had in view when they adopted the recent amendments of the Constitution...

[Justice John Marshall Harlan — sole dissent, 1896]`,
    metadata: {
      sourceSlug: 'plessy-v-ferguson-harlan-dissent-1896',
      creator: 'Justice John Marshall Harlan, U.S. Supreme Court (dissent)',
      date: '1896-05-18',
      collection: 'National Archives — U.S. Supreme Court Records',
      rights: 'public_domain',
      topics: ['Plessy v. Ferguson', 'dissent', 'civil rights', 'equal protection', 'segregation'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['compare-sources', 'document-analysis'],
      narrativeRole: 'counter_document',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Harlan was a former enslaver from Kentucky. Why might it matter that the one dissenter came from this background?',
        'Harlan predicted that this decision would "stimulate aggressions" against Black citizens. Was he right?',
        'It took 58 years for the Court to catch up to Harlan\'s dissent. What does that gap tell us about the pace of justice?',
      ],
      citation: 'Plessy v. Ferguson, 163 U.S. 537 (1896). Harlan, J., dissenting.',
    },
  },
  {
    title: 'Thomas Jefferson — Letter to Edward Coles: "The Wolf by the Ear" (1814)',
    content: `I had always hoped that the younger generation receiving their early impressions after the flame of liberty had been kindled in every breast... would have sympathized with oppression wherever found, and proved their love of liberty beyond their own share of it. But... I have outlived the generation of 1776. Mine is the next generation. The last sure that could give force and direction to the slave institution is departed, and their children have been habituated to it from their cradles...

I can say with conscious truth that there is not a man on earth who would sacrifice more than I would to relieve us from this heavy reproach, in any practicable way. The cession of that kind of property, for so it is misnamed, is a bagatelle which would not cost me a second thought, if, in that way, a general emancipation and expatriation could be effected; and, gradually, and with due sacrifices, I think it might be. But as it is, we have the wolf by the ear, and we can neither hold him, nor safely let him go. Justice is in one scale, and self-preservation in the other.`,
    metadata: {
      sourceSlug: 'jefferson-coles-wolf-by-ear-1814',
      creator: 'Thomas Jefferson',
      date: '1814-08-25',
      collection: 'Library of Congress — Thomas Jefferson Papers',
      url: 'https://www.loc.gov/resource/mtj1.048_0581_0583/',
      rights: 'public_domain',
      topics: ['slavery', 'Thomas Jefferson', 'Declaration of Independence', 'founding fathers', 'hypocrisy'],
      era: 'early-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'document-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'James 2:17', connection: 'Faith without works is dead — Jefferson said the right words but chose his comfort over 600 people\'s freedom' }],
      contentWarnings: [],
      investigationPrompts: [
        'Jefferson wrote "all men are created equal" in 1776 and owned 600+ enslaved people. In 1814 he admits he knows slavery is wrong. What does "self-preservation" mean for a man with his wealth and status?',
        'He calls it a "reproach" — meaning shame. Who bears the shame in his framing?',
        'Jefferson could have freed his enslaved people in his will (Washington did). He did not, except for 5 of 600+. What does action tell us that words do not?',
      ],
      citation: 'Jefferson, Thomas. Letter to Edward Coles. August 25, 1814. Library of Congress, Thomas Jefferson Papers.',
    },
  },
  {
    title: 'Ida B. Wells — Southern Horrors: Lynch Law in All Its Phases (1892)',
    content: `The same issue of the Memphis Daily Commercial which announced the lynching of three of our best men, also contained a four-column article on the "Outrages" against the white women of the South. This is the old threadbare lie that Negro men rape white women. If Southern white men are not careful, they will over-reach themselves and public sentiment will have a reaction; a conclusion will then be reached which will be very damaging to the moral reputation of their women.

Nobody in this section of the country believes the old thread bare lie that Negro men rape white women. If Southern white men are not careful, they will over-reach themselves and public sentiment will have a reaction... The truth about the "outrages" is that Southern men do not object to lynch Negroes when they feel the Negro is becoming too prosperous for a member of an inferior race... When the white man who is always the aggressor knows he runs as great a risk of biting the dust every time his Afro-American victim does, he will have greater respect for Afro-American life. The more the Afro-American yields and cringes and begs, the more he has to do so, the more he is insulted, outraged and lynched.`,
    metadata: {
      sourceSlug: 'ida-b-wells-southern-horrors-1892',
      creator: 'Ida B. Wells',
      date: '1892',
      collection: 'Library of Congress — Rare Books Collection',
      url: 'https://www.loc.gov/item/90898052/',
      rights: 'public_domain',
      topics: ['lynching', 'Ida B. Wells', 'civil rights', 'racial terrorism', 'Reconstruction era', 'press freedom'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'document-analysis', 'follow-the-money'],
      narrativeRole: 'investigative_data',
      scriptureConnections: [{ passage: 'Proverbs 31:8-9', connection: 'Speak up for those who cannot speak for themselves — Wells did exactly this at great personal risk' }],
      contentWarnings: ['racial violence', 'lynching'],
      investigationPrompts: [
        'Wells argues that lynching was used to eliminate economic competition, not to "protect" white women. What evidence does she provide?',
        'After publishing this, her newspaper office was burned down and she received death threats. Why would exposing the truth about lynching be treated as a crime?',
        'Who benefited from the false narrative that lynching was about protecting women?',
      ],
      citation: 'Wells, Ida B. Southern Horrors: Lynch Law in All Its Phases. New York Age Print, 1892. Library of Congress.',
    },
  },
  {
    title: 'Susan B. Anthony — Statement at Her Trial for Voting (1873)',
    content: `Judge Hunt — (Ordering the defendant to stand up) Has the prisoner anything to say why sentence shall not be pronounced?

Miss Anthony — Yes, your honor, I have many things to say; for in your ordered verdict of guilty, you have trampled under foot every vital principle of our government. My natural rights, my civil rights, my political rights, my judicial rights, are all alike ignored. Robbed of the fundamental privilege of citizenship, I am degraded from the status of a citizen to that of a subject; and not only myself individually, but all of my sex, are, by your honor's verdict, doomed to political subjection under this so-called republican government.

Judge Hunt — The Court cannot allow the prisoner to go on.

Miss Anthony — But your honor will not deny me this one and only poor privilege of protest against this high-handed outrage upon my citizen's rights. May it please the court to remember that since the day of my arrest last November, this is the first time that either myself or any person of my disenfranchised class has been allowed a word of defense before judge or jury...

Judge Hunt — The prisoner will stand up. (Sentence: $100 fine) The Court cannot allow any further remarks.

Miss Anthony — I shall never pay a dollar of your unjust penalty.`,
    metadata: {
      sourceSlug: 'anthony-trial-statement-1873',
      creator: 'Susan B. Anthony',
      date: '1873-06-19',
      collection: 'National Archives — Circuit Court Records',
      rights: 'public_domain',
      topics: ['suffrage', 'Susan B. Anthony', 'voting rights', 'women\'s rights', 'civil disobedience'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '6-12',
      investigationTypes: ['document-analysis', 'propaganda-analysis'],
      narrativeRole: 'victim_testimony',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'The judge ordered the jury to find her guilty before hearing her defense. What does this tell you about the purpose of the trial?',
        'Anthony says she is "degraded from citizen to subject." What is the legal difference between a citizen and a subject?',
        'She refused to pay the fine. The government chose not to pursue it — why do you think that is?',
      ],
      citation: 'Anthony, Susan B. Statement at sentencing, United States v. Susan B. Anthony. June 19, 1873. Circuit Court, Northern District of New York.',
    },
  },
  {
    title: 'Smedley Butler — "War Is a Racket" (1935)',
    content: `War is a racket. It always has been. It is possibly the oldest, easily the most profitable, surely the most vicious. It is the only one international in scope. It is the only one in which the profits are reckoned in dollars and the losses in death.

I spent 33 years and 4 months in active military service and during that period I spent most of my time as a high class muscle man for Big Business, for Wall Street and the bankers. In short, I was a racketeer, a gangster for capitalism. I helped make Mexico and especially Tampico safe for American oil interests in 1914. I helped make Haiti and Cuba a decent place for the National City Bank boys to collect revenues in. I helped in the raping of half a dozen Central American republics for the benefit of Wall Street. I helped purify Nicaragua for the International Banking House of Brown Brothers in 1902–1912. I brought light to the Dominican Republic for the American sugar interests in 1916. I helped make Honduras right for the American fruit companies in 1903. In China in 1927 I helped see to it that Standard Oil went on its way unmolested. Looking back on it, I might have given Al Capone a few hints. The best he could do was to operate his racket in three districts. I operated on three continents.`,
    metadata: {
      sourceSlug: 'smedley-butler-war-is-a-racket-1935',
      creator: 'Major General Smedley D. Butler, USMC (two-time Medal of Honor recipient)',
      date: '1935',
      collection: 'Published pamphlet — public domain',
      rights: 'public_domain',
      topics: ['war', 'imperialism', 'corporations', 'military industrial complex', 'Central America', 'WWI'],
      era: 'early-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics', 'justice-changemaking'],
      readingLevel: '9-12',
      investigationTypes: ['follow-the-money', 'propaganda-analysis'],
      narrativeRole: 'eyewitness',
      scriptureConnections: [{ passage: 'Matthew 6:24', connection: 'You cannot serve both God and money — Butler saw firsthand which master the military was actually serving' }],
      contentWarnings: [],
      investigationPrompts: [
        'Butler was the most decorated Marine in U.S. history when he wrote this. Why does his rank matter for evaluating this source?',
        'He names specific companies — National City Bank, Standard Oil, United Fruit Company. Look up what those companies became. Are they still operating today?',
        'Why is this speech not in most school textbooks that cover WWI and U.S. foreign policy?',
      ],
      citation: 'Butler, Smedley D. War Is a Racket. Round Table Press, 1935. Now public domain.',
    },
  },
  {
    title: 'Treaty of Versailles — Article 231: The "War Guilt" Clause (1919)',
    content: `ARTICLE 231: Germany accepts the responsibility of Germany and her allies for causing all the loss and damage to which the Allied and Associated Governments and their nationals have been subjected as a consequence of the war imposed upon them by the aggression of Germany and her allies.

ARTICLE 232: The Allied and Associated Governments recognize that the resources of Germany are not adequate, after taking into account permanent diminutions of such resources which will result from other provisions of the present Treaty, to make complete reparation for all such loss and damage. The Allied and Associated Governments, however, require, and Germany undertakes, that she will make compensation for all damage done to the civilian population of the Allied and Associated Powers and to their property...

[Context: Germany was assessed 132 billion gold marks in reparations — approximately $33 billion USD in 1921 ($500+ billion today). Germany made its final reparations payment in 2010. John Maynard Keynes, a British economist who attended the Paris Peace Conference, resigned in protest and wrote "The Economic Consequences of the Peace" (1919), predicting the treaty would lead to another war within 20 years.]`,
    metadata: {
      sourceSlug: 'treaty-versailles-article-231-war-guilt-1919',
      creator: 'Allied Powers — Treaty of Versailles',
      date: '1919-06-28',
      collection: 'Avalon Project, Yale Law School',
      url: 'https://avalon.law.yale.edu/imt/parti.asp',
      rights: 'public_domain',
      topics: ['Treaty of Versailles', 'WWI', 'WWII causes', 'reparations', 'war guilt', 'Germany', 'Weimar Republic'],
      era: 'early-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['follow-the-money', 'document-analysis', 'timeline'],
      narrativeRole: 'government_record',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Keynes predicted in 1919 that the Treaty would cause another world war in 20 years. WWII began in 1939 — 20 years later. What does this tell us about the relationship between economic humiliation and political extremism?',
        'Germany made its final reparations payment in 2010 — 91 years after the treaty. Who collected that money?',
        'The War Guilt clause blamed Germany exclusively. But who else contributed to starting WWI? Why might the victors write history this way?',
      ],
      citation: 'Treaty of Versailles, Article 231. Signed June 28, 1919. Avalon Project, Yale Law School.',
    },
  },
  {
    title: 'The Gulf of Tonkin Resolution (1964)',
    content: `JOINT RESOLUTION: To promote the maintenance of international peace and security in southeast Asia.

Whereas naval units of the Communist regime in Vietnam, in violation of the principles of the Charter of the United Nations and of international law, have deliberately and repeatedly attacked United States naval vessels lawfully present in international waters, and have thereby created a serious threat to international peace; and...

Resolved by the Senate and House of Representatives of the United States of America in Congress assembled, That the Congress approves and supports the determination of the President, as Commander in Chief, to take all necessary measures to repel any armed attack against the forces of the United States and to prevent further aggression...

SECTION 2. The United States regards as vital to its national interest and to world peace the maintenance of international peace and security in southeast Asia. Consonant with the Constitution of the United States and the Charter of the United Nations and in accordance with its obligations under the Southeast Asia Collective Defense Treaty, the United States is, therefore, prepared, as the President determines, to take all necessary steps, including the use of armed force...

[Compare: Robert McNamara admitted in 1995 that the second Gulf of Tonkin attack "simply did not occur."]`,
    metadata: {
      sourceSlug: 'gulf-of-tonkin-resolution-1964',
      creator: 'U.S. Congress — 88th Congress',
      date: '1964-08-07',
      collection: 'National Archives',
      url: 'https://www.archives.gov/milestone-documents/gulf-of-tonkin',
      rights: 'public_domain',
      topics: ['Vietnam War', 'Gulf of Tonkin', 'Congress', 'war powers', 'government deception', 'Cold War'],
      era: 'mid-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'compare-sources', 'document-analysis'],
      narrativeRole: 'official_claim',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Congress authorized this war on the basis of an attack that McNamara later admitted never happened. Who is responsible — the president who lied, or the Congress that did not verify?',
        'The resolution gives the president power to "take all necessary steps" — no declaration of war, no specific limits. Why might a president want war authorization written this vaguely?',
        'Connect this to the Creel Committee (WWI) and the WMD claims before the Iraq War. What pattern do you see?',
      ],
      citation: 'Gulf of Tonkin Resolution (H.J. Res. 1145), August 7, 1964. 88th Congress. National Archives.',
    },
  },
  {
    title: 'Micah 6:8 — What the Lord Requires',
    content: `He has told you, O man, what is good; and what does the LORD require of you but to do justice, and to love kindness, and to walk humbly with your God? — Micah 6:8 (ESV)

Context: Micah was a prophet in 8th century BC Israel, speaking to a society where wealthy landowners were seizing property from small farmers, judges were taking bribes, and religious leaders preached whatever the powerful wanted to hear. Micah 2:1-2 reads: "Woe to those who devise wickedness and work evil on their beds! When the morning dawns, they perform it, because it is in the power of their hand. They covet fields and seize them, and houses, and take them away; they oppress a man and his house, a man and his inheritance."`,
    metadata: {
      sourceSlug: 'micah-6-8-justice-kindness',
      creator: 'Scripture — Old Testament / Hebrew Prophets',
      date: '~730 BC',
      collection: 'Holy Bible, ESV',
      rights: 'public_domain',
      topics: ['justice', 'mercy', 'humility', 'prophets', 'scripture', 'social justice'],
      era: 'ancient',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'discipleship-cultural-discernment'],
      readingLevel: '6-12',
      investigationTypes: ['compare-sources'],
      narrativeRole: 'scripture',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: ['Micah was speaking to a society with land seizures and corrupt judges — does this sound familiar to any history we\'ve studied?', 'What is the difference between justice and charity? Why does Micah say "do justice" rather than "be charitable"?'],
      citation: 'The Holy Bible, English Standard Version. Micah 6:8; 2:1-2. Crossway Bibles, 2001.',
    },
  },
  {
    title: 'Olaudah Equiano — The Interesting Narrative: The Middle Passage (1789)',
    content: `The stench of the hold while we were on the coast was so intolerably loathsome, that it was dangerous to remain there for any time, and some of us had been permitted to stay on the deck for the fresh air; but now that the whole ship's cargo were confined together, it became absolutely pestilential. The closeness of the place, and the heat of the climate, added to the number in the ship, which was so crowded that each had scarcely room to turn himself, almost suffocated us. This produced copious perspirations, so that the air soon became unfit for respiration, from a variety of loathsome smells, and brought on a sickness among the slaves, of which many died, thus falling victims to the improvident avarice, as I may call it, of their purchasers...

I was soon put down under the decks, and there I received such a salutation in my nostrils as I had never experienced in my life: so that, with the rottenness of the stench, and crying together, I became so sick and low that I was not able to eat, nor had I the least desire to taste any thing. I now wished for the last friend, Death, to relieve me...

At last we came in sight of the island of Barbadoes, at which the whites on board gave a great shout, and made many signs of joy to us. We did not know what to think of this; but as the vessel drew nearer, we plainly saw the harbour, and other ships of different kinds and sizes; and we soon anchored amongst them off Bridgetown.`,
    metadata: {
      sourceSlug: 'equiano-middle-passage-1789',
      creator: 'Olaudah Equiano (Gustavus Vassa)',
      date: '1789',
      collection: 'The Interesting Narrative of the Life of Olaudah Equiano — public domain',
      url: 'https://docsouth.unc.edu/neh/equiano1/equiano1.html',
      rights: 'public_domain',
      topics: ['Atlantic slave trade', 'Middle Passage', 'slavery', 'African diaspora', 'colonialism'],
      era: 'early-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '6-12',
      investigationTypes: ['document-analysis', 'propaganda-analysis'],
      narrativeRole: 'eyewitness',
      scriptureConnections: [{ passage: 'Matthew 25:40', connection: 'Whatever you did to the least of these, you did to me — Equiano\'s account describes what millions experienced in the name of economic profit' }],
      contentWarnings: ['graphic descriptions of suffering', 'slavery'],
      investigationPrompts: [
        'Equiano was one of the rare survivors who was literate and could publish his account. How many people crossed the Middle Passage who left no written record?',
        'He calls the slave traders\' greed "improvident avarice." How does naming who profits from suffering clarify who is responsible?',
        'Textbooks often describe the slave trade in numbers (12 million transported). How does this eyewitness account change your understanding of what those numbers mean?',
      ],
      citation: 'Equiano, Olaudah. The Interesting Narrative of the Life of Olaudah Equiano, or Gustavus Vassa, the African. London, 1789.',
    },
  },
  {
    title: 'Chinese Exclusion Act (1882)',
    content: `AN ACT to execute certain treaty stipulations relating to Chinese.

Whereas, in the opinion of the Government of the United States the coming of Chinese laborers to this country endangers the good order of certain localities within the territory thereof: Therefore,

Be it enacted by the Senate and House of Representatives of the United States of America in Congress assembled, That from and after the expiration of ninety days next after the passage of this act, and until the expiration of ten years next after the passage of this act, the coming of Chinese laborers to the United States be, and the same is hereby, suspended; and during such suspension it shall not be lawful for any Chinese laborer to come, or having so come after the expiration of said ninety days, to remain within the United States.

SECTION 14. That hereafter no State court or court of the United States shall admit Chinese to citizenship; and all laws in conflict with this act are hereby repealed.

[The act was extended in 1892, made permanent in 1902, and repealed in 1943 — 61 years later — only because China was a WWII ally and the U.S. needed propaganda value. Chinese Americans had built the transcontinental railroad.]`,
    metadata: {
      sourceSlug: 'chinese-exclusion-act-1882',
      creator: 'U.S. Congress — 47th Congress',
      date: '1882-05-06',
      collection: 'National Archives',
      url: 'https://www.archives.gov/milestone-documents/chinese-exclusion-act',
      rights: 'public_domain',
      topics: ['Chinese Exclusion Act', 'immigration', 'racism', 'labor', 'transcontinental railroad', 'Asian American history'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'government-economics'],
      readingLevel: '6-12',
      investigationTypes: ['document-analysis', 'follow-the-money', 'propaganda-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Leviticus 19:34', connection: 'The foreigner who lives among you shall be as a native citizen — this law was the direct opposite of God\'s command' }],
      contentWarnings: [],
      investigationPrompts: [
        'Chinese laborers built the western half of the transcontinental railroad, working for lower wages in more dangerous conditions than white workers. Who benefited economically from their labor, and then what happened?',
        'The law was only repealed in 1943 — explicitly because China was a war ally and it made the U.S. look bad. What does this tell us about when and why rights are granted?',
        'This was the first and only U.S. law to exclude a specific nationality by name. What does that precedent establish?',
      ],
      citation: 'Chinese Exclusion Act. 47th U.S. Congress. May 6, 1882. National Archives.',
    },
  },
  {
    title: 'The Monroe Doctrine (1823) — and Its Later Reinterpretations',
    content: `President James Monroe, Annual Message to Congress, December 2, 1823:

"...the American continents, by the free and independent condition which they have assumed and maintain, are henceforth not to be considered as subjects for future colonization by any European powers...

We owe it, therefore, to candor and to the amicable relations existing between the United States and those powers to declare that we should consider any attempt on their part to extend their system to any portion of this hemisphere as dangerous to our peace and safety."

[ROOSEVELT COROLLARY, 1904 — Theodore Roosevelt's extension of the Monroe Doctrine]:
"Chronic wrongdoing, or an impotence which results in a general loosening of the ties of civilized society, may in America, as elsewhere, ultimately require intervention by some civilized nation, and in the Western Hemisphere the adherence of the United States to the Monroe Doctrine may force the United States, however reluctantly, in flagrant cases of such wrongdoing or impotence, to the exercise of an international police power."

[Result: Between 1898 and 1934, the U.S. militarily intervened in Cuba, Puerto Rico, the Philippines, Guam, Nicaragua, Haiti, the Dominican Republic, Mexico, Honduras, and Panama — often to protect private American business interests.]`,
    metadata: {
      sourceSlug: 'monroe-doctrine-1823-roosevelt-corollary',
      creator: 'President James Monroe (1823) / President Theodore Roosevelt (1904)',
      date: '1823-12-02',
      collection: 'National Archives / Avalon Project, Yale Law School',
      rights: 'public_domain',
      topics: ['Monroe Doctrine', 'imperialism', 'Latin America', 'foreign policy', 'U.S. interventionism', 'Roosevelt Corollary'],
      era: 'early-19th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'document-analysis', 'follow-the-money'],
      narrativeRole: 'official_claim',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Monroe said the Western Hemisphere was off-limits to European colonization. Roosevelt extended this to mean the U.S. could intervene whenever it judged a country guilty of "wrongdoing." How does the original doctrine get rewritten?',
        'Roosevelt calls U.S. intervention "reluctant." Compare this to Smedley Butler\'s account of what those interventions actually protected. Who is telling the truth?',
        'The Monroe Doctrine is still cited in U.S. foreign policy today. What does it mean for sovereignty when the most powerful nation in a region claims the right to police everyone else?',
      ],
      citation: 'Monroe, James. Annual Message to Congress. December 2, 1823. Roosevelt, Theodore. Annual Message to Congress. December 6, 1904. National Archives.',
    },
  },
  {
    title: 'The Berlin Conference — General Act: European Powers Divide Africa (1885)',
    content: `ARTICLE 34: Any Power which henceforth takes possession of a tract of land on the coasts of the African Continent outside of its present possessions, or which, being hitherto without such possessions, shall acquire them, as well as the Power which assumes a Protectorate there, shall accompany the respective act with a notification thereof, addressed to the other Signatory Powers of the present Act...

ARTICLE 35: The Signatory Powers of the present Act recognize the obligation to insure the establishment of authority in the regions occupied by them on the coasts of the African Continent sufficient to protect existing rights, and, as the case may be, freedom of trade and of transit under the conditions agreed upon.

[Context: Fourteen European nations met in Berlin from November 1884 to February 1885 to divide the African continent among themselves. Not a single African leader was invited or consulted. Within 15 years, 90% of Africa was under European colonial rule. The conference was called by Otto von Bismarck, hosted in Germany, and attended by: Austria-Hungary, Belgium, Denmark, France, Great Britain, Italy, Netherlands, Portugal, Russia, Spain, Sweden-Norway, the Ottoman Empire, and the United States.]`,
    metadata: {
      sourceSlug: 'berlin-conference-general-act-1885',
      creator: 'Fourteen European Powers — Berlin West Africa Conference',
      date: '1885-02-26',
      collection: 'Avalon Project, Yale Law School',
      rights: 'public_domain',
      topics: ['Berlin Conference', 'Scramble for Africa', 'colonialism', 'imperialism', 'Africa', 'European powers'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'justice-changemaking', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['document-analysis', 'follow-the-money', 'propaganda-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [{ passage: 'Psalm 24:1', connection: 'The earth is the Lord\'s and everything in it — fourteen nations divided a continent they did not own and had no right to claim' }],
      contentWarnings: [],
      investigationPrompts: [
        'No Africans were present at the conference that decided the fate of 130 million people. How does the absence of affected peoples in decision-making shape outcomes?',
        'The language is bureaucratic and neutral — "notification," "authority," "protection." What do these words actually mean in practice?',
        'Many of today\'s African conflicts trace directly to borders drawn at this conference that cut through tribal lands and grouped enemies together. Who bears the cost of those decisions today?',
      ],
      citation: 'General Act of the Berlin Conference on West Africa. February 26, 1885. Avalon Project, Yale Law School.',
    },
  },
  {
    title: 'Mark Twain — "To the Person Sitting in Darkness": Against U.S. Imperialism in the Philippines (1901)',
    content: `Shall we? That is, shall we go on conferring our Civilization upon the peoples that sit in darkness, or shall we give those poor things a rest? Shall we bang away at them with the Bible and Buller, or shall we reflect? ...

And as for a flag for the Philippine Province, it is easily managed. We can have a special one — our States do it: we can have just our usual flag, with the white stripes painted black and the stars replaced by the skull and cross-bones...

We cannot conceal from ourselves that, privately, we are a little troubled about our uniform. It is one of our prides; it is acquainted with honor; it is familiar with great deeds and noble; we love it, we revere it; and so this errand it is on makes us uneasy... to-day we are playing the European game, the Bully-game. I feel as oppressed and ashamed as a burglar's child might feel... For it is William McKinley's game, a rich man's game; the object is to get territory, the resources, the markets, and the cheap labor of the Philippines...`,
    metadata: {
      sourceSlug: 'mark-twain-imperialism-philippines-1901',
      creator: 'Mark Twain',
      date: '1901-02',
      collection: 'North American Review, February 1901 — public domain',
      rights: 'public_domain',
      topics: ['Philippines', 'imperialism', 'Spanish-American War', 'Mark Twain', 'Anti-Imperialist League', 'U.S. foreign policy'],
      era: 'early-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'document-analysis'],
      narrativeRole: 'counter_document',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Twain was one of the most famous Americans alive when he wrote this. Why is this essay not commonly taught in schools alongside the "splendid little war" narrative?',
        'He says the object is "territory, resources, markets, and cheap labor." Compare this to Smedley Butler\'s list of countries. Is this pattern consistent?',
        'He proposes a flag with the skull and cross-bones. What point is he making about the gap between American symbols and American actions?',
      ],
      citation: 'Twain, Mark. "To the Person Sitting in Darkness." North American Review, February 1901. Public domain.',
    },
  },
  {
    title: 'Henry Stimson Diary — Japan\'s Peace Feelers Before the Atomic Bomb (1945)',
    content: `[Diary entry, Secretary of War Henry Stimson, July 2, 1945 — six weeks before Hiroshima]:

"Japan is susceptible to reason in such a crisis to a much greater extent than is indicated by our current press and the prevailing opinion against her... I think the Japanese nation has the mental intelligence and versatile capacity in such a crisis to recognize the folly of a fight to the finish and to accept the proffer of what will amount to an unconditional surrender; and they will do it if we do not make too big a mess of the terms..."

[Context: By summer 1945, Japan had sent peace feelers through Switzerland and Sweden, asking only for retention of the Emperor. The OSS (forerunner of the CIA) was aware. The Joint Chiefs' own intelligence estimate said Japan would likely surrender before November 1945 even without the bomb. Stimson's diary reveals the administration debated offering to keep the Emperor before Hiroshima — a concession they ultimately made anyway in the surrender terms.]`,
    metadata: {
      sourceSlug: 'stimson-diary-japan-peace-1945',
      creator: 'Secretary of War Henry Stimson',
      date: '1945-07-02',
      collection: 'Yale University Library — Henry L. Stimson Papers',
      rights: 'public_domain',
      topics: ['atomic bomb', 'WWII', 'Hiroshima', 'Japan', 'peace negotiations', 'Cold War origins'],
      era: 'mid-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['document-analysis', 'compare-sources', 'propaganda-analysis'],
      narrativeRole: 'government_record',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Stimson believed Japan would surrender without the bomb. The peace terms the U.S. ultimately accepted (keeping the Emperor) were available before Hiroshima. If Japan would have surrendered anyway, what other reasons might explain why the bombs were used?',
        'The official narrative is that the atomic bombs "ended the war and saved lives." Who in the U.S. government was aware of Japan\'s peace feelers, and when?',
        'Some historians argue the bombs were partly a message to the Soviet Union about American power. What evidence might support or challenge this?',
      ],
      citation: 'Stimson, Henry L. Diary entry, July 2, 1945. Henry L. Stimson Papers. Yale University Library.',
    },
  },
  {
    title: 'CIA Declassified Admission: The 1953 Iran Coup (2013)',
    content: `From a CIA internal history declassified in 2013 (National Security Archive):

"The military coup that overthrew Mosaddeq and his National Front cabinet was carried out under CIA direction as an act of United States foreign policy, conceived and approved at the highest levels of government."

[Context: Mohammad Mosaddeq was the democratically elected Prime Minister of Iran who nationalized the Anglo-Iranian Oil Company (later BP) in 1951, arguing that Iranian oil profits should belong to Iranian people. The British government, losing oil revenue, asked the U.S. for help. The CIA operation (codenamed AJAX / Operation Boot) spent approximately $1 million bribing Iranian military officers and hiring mobs to destabilize Mosaddeq's government. The Shah (installed after the coup) ruled as a brutal U.S.-backed autocrat until the 1979 Iranian Revolution. U.S. relations with Iran have been hostile ever since.]`,
    metadata: {
      sourceSlug: 'cia-iran-coup-admission-1953-2013',
      creator: 'Central Intelligence Agency — declassified internal history',
      date: '2013-08-19',
      collection: 'National Security Archive, George Washington University',
      url: 'https://nsarchive.gwu.edu/briefing-book/iran/2013-08-19/cia-confirms-role-1953-iran-coup',
      rights: 'public_domain',
      topics: ['CIA', 'Iran', 'Mosaddeq', 'coup', 'Cold War', 'oil', 'imperialism', 'covert operations'],
      era: 'mid-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['follow-the-money', 'document-analysis', 'timeline'],
      narrativeRole: 'government_record',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Mosaddeq was democratically elected and wanted Iran\'s oil profits to benefit Iranians. He was overthrown because he threatened foreign oil company profits. Follow the money: who benefited from the coup?',
        'The U.S. replaced Mosaddeq with the Shah, who was known for torture and brutality. When the Shah fell in 1979, Iranians blamed America. Given this history, is that reaction surprising?',
        'This document was classified for 60 years. What other current events might be understood differently in 60 years with documents that are classified today?',
      ],
      citation: 'CIA, "Clandestine Service History, Overthrow of Premier Mossadeq of Iran, November 1952–August 1953." Declassified August 19, 2013. National Security Archive.',
    },
  },
  {
    title: 'Andrew Carnegie — "The Gospel of Wealth" (1889)',
    content: `The price which society pays for the law of competition, like the price it pays for cheap comforts and luxuries, is also great; but the advantages of this law are also greater still, for it is to this law that we owe our wonderful material development, which brings improved conditions in its train. But, whether the law be benign or not, we must say of it, as we say of the change in the conditions of men to which we have referred: It is here; we cannot evade it; no substitutes for it have been found; and while the law may be sometimes hard for the individual, it is best for the race, because it insures the survival of the fittest in every department...

This, then, is held to be the duty of the man of Wealth: First, to set an example of modest, unostentatious living, shunning display or extravagance; to provide moderately for the legitimate wants of those dependent upon him; and after doing so to consider all surplus revenues which come to him simply as trust funds, which he is called upon to administer, and strictly bound as a matter of duty to administer in the manner which, in his judgment, is best calculated to produce the most beneficial result for the community — the man of wealth thus becoming the mere trustee and agent for his poorer brethren, bringing to their service his superior wisdom, experience and ability to administer...`,
    metadata: {
      sourceSlug: 'carnegie-gospel-of-wealth-1889',
      creator: 'Andrew Carnegie',
      date: '1889-06',
      collection: 'North American Review, June 1889 — public domain',
      rights: 'public_domain',
      topics: ['Gilded Age', 'Carnegie', 'philanthropy', 'capitalism', 'labor', 'wealth inequality', 'survival of the fittest'],
      era: 'late-19th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['propaganda-analysis', 'follow-the-money', 'document-analysis'],
      narrativeRole: 'official_claim',
      scriptureConnections: [{ passage: 'Luke 12:48', connection: 'To whom much is given, much will be required — Carnegie claimed this obligation, but his workers were paid poverty wages to generate the surplus he gave away' }],
      contentWarnings: [],
      investigationPrompts: [
        'Carnegie says the wealthy man is a "trustee" for the poor and will administer their welfare through "superior wisdom." Who decides what is best for poor people in this model?',
        'Carnegie\'s steel workers worked 12-hour days, 7 days a week for poverty wages. In 1892, he locked them out and hired Pinkertons with rifles. Does his philosophy match his actions?',
        'Today we call this "trickle-down economics" or "philanthrocapitalism." What are the differences and similarities between Carnegie\'s vision and modern billionaire philanthropy?',
      ],
      citation: 'Carnegie, Andrew. "Wealth." North American Review, June 1889. Public domain.',
    },
  },
  {
    title: 'Pentagon Papers — Daniel Ellsberg\'s Summary of Systematic Deception (1971)',
    content: `[From Ellsberg's introduction to the leaked Pentagon Papers, New York Times, 1971]:

"The Pentagon Papers revealed that the government had systematically lied, not only to the public but to Congress, about a subject of transcendent national importance — the Vietnam War. The documents showed: that the Truman Administration decided to support French colonialism even though the documents said Ho Chi Minh had the support of 80% of the Vietnamese population; that the Eisenhower Administration blocked free elections in Vietnam, which U.S. officials knew Ho Chi Minh would win; that the Kennedy Administration began combat operations before admitting U.S. forces were in combat; that the Johnson Administration planned to expand the war while telling the public the opposite; that the Gulf of Tonkin attack was used to gain war powers when officials doubted the second attack ever occurred."

[The papers covered the decision-making process from Truman through Johnson — four presidents and 20 years of systematic deception documented by the government itself.]`,
    metadata: {
      sourceSlug: 'pentagon-papers-ellsberg-summary-1971',
      creator: 'Daniel Ellsberg / U.S. Department of Defense (source documents)',
      date: '1971-06-13',
      collection: 'New York Times / National Archives',
      rights: 'public_domain',
      topics: ['Pentagon Papers', 'Vietnam War', 'government deception', 'Ellsberg', 'press freedom', 'whistleblowers'],
      era: 'mid-20th-century',
      subjectTracks: ['truth-based-history', 'government-economics'],
      readingLevel: '9-12',
      investigationTypes: ['document-analysis', 'timeline', 'propaganda-analysis'],
      narrativeRole: 'investigative_data',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Four consecutive presidents — spanning 20 years and two political parties — all deceived the American public about Vietnam. What does this tell us about institutional incentives vs. individual character?',
        'Ellsberg was charged under the Espionage Act for leaking these documents. The Supreme Court ruled in his favor. What is the difference between a whistleblower and a traitor?',
        'The documents showed officials knew Ho Chi Minh had 80% public support in Vietnam. If the U.S. believed in self-determination, why did it fight against the popular will of the Vietnamese people?',
      ],
      citation: 'Ellsberg, Daniel. The Pentagon Papers. New York Times, June 13, 1971. National Archives digital collections.',
    },
  },
  {
    title: 'Proverbs 31:8-9 — Speak Up for Those Who Cannot Speak for Themselves',
    content: `Open your mouth for the mute, for the rights of all who are destitute. Open your mouth, judge righteously, defend the rights of the poor and needy. — Proverbs 31:8-9 (ESV)

Context: These verses were spoken by a mother instructing her son, a king. The standard of justice for those in power is clear: the measure of leadership is how it treats those who cannot defend themselves. Throughout the sources in this collection — the Middle Passage, the Black Codes, the Trail of Tears, the Chinese laborers — ask: who had no voice? Who could not speak for themselves? And who opened their mouth on their behalf, and who stayed silent?`,
    metadata: {
      sourceSlug: 'proverbs-31-8-9-speak-up',
      creator: 'Scripture — Old Testament / Hebrew Wisdom Literature',
      date: '~900 BC',
      collection: 'Holy Bible, ESV',
      rights: 'public_domain',
      topics: ['justice', 'advocacy', 'the poor', 'power', 'wisdom', 'scripture'],
      era: 'ancient',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '3-12',
      investigationTypes: ['compare-sources', 'document-analysis'],
      narrativeRole: 'scripture',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'This was advice from a mother to a king. What does it say about who is responsible for justice when they hold power?',
        'Think of every primary source you\'ve read. Who was the person who "could not speak for themselves" in each story — and who, if anyone, spoke up?',
      ],
      citation: 'The Holy Bible, English Standard Version. Proverbs 31:8-9. Crossway Bibles, 2001.',
    },
  },
  {
    title: 'Isaiah 58:6 — True Justice Is Loosing Chains',
    content: `Is not this the fast that I choose: to loose the bonds of wickedness, to undo the straps of the yoke, to let the oppressed go free, and to break every yoke? Is it not to share your bread with the hungry and bring the homeless poor into your house; when you see the naked, to cover him, and not to hide yourself from your own flesh? — Isaiah 58:6-7 (ESV)

Context: Isaiah was writing to a religious people who fasted and prayed but tolerated slavery, exploitation of workers, and corruption in their courts. God's response: your religious ritual means nothing if it coexists with oppression. The word "yoke" in the ancient Near East was literal — both animals and enslaved people wore yokes. "Loosing the yoke" was not metaphorical to Isaiah's first audience. Compare this standard to the 13th Amendment, the Black Codes, and convict leasing.`,
    metadata: {
      sourceSlug: 'isaiah-58-6-loose-chains',
      creator: 'Scripture — Old Testament / Hebrew Prophets',
      date: '~700 BC',
      collection: 'Holy Bible, ESV',
      rights: 'public_domain',
      topics: ['justice', 'oppression', 'slavery', 'fasting', 'religion vs. action', 'scripture'],
      era: 'ancient',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '3-12',
      investigationTypes: ['compare-sources', 'document-analysis'],
      narrativeRole: 'scripture',
      scriptureConnections: [],
      contentWarnings: [],
      investigationPrompts: [
        'Isaiah says religious observance is worthless without justice for the oppressed. How does this standard apply to a nation that wrote "In God We Trust" on its money while maintaining legal slavery?',
        'The passage says "break every yoke." Not reduce. Not reform. Every. How does this level of expectation compare to the compromises made in U.S. emancipation history?',
      ],
      citation: 'The Holy Bible, English Standard Version. Isaiah 58:6-7. Crossway Bibles, 2001.',
    },
  },
  {
    title: 'Luke 4:18-19 — Jesus Declares His Mission from Isaiah',
    content: `"The Spirit of the Lord is upon me, because he has anointed me to proclaim good news to the poor. He has sent me to proclaim liberty to the captives and recovering of sight to the blind, to set at liberty those who are oppressed, to proclaim the year of the Lord's favor." — Luke 4:18-19 (ESV)

Context: Jesus read this from the scroll of Isaiah 61 in his hometown synagogue and said "Today this Scripture has been fulfilled in your hearing." The "year of the Lord's favor" directly references the Year of Jubilee from Leviticus 25 — the year all debts were cancelled, all land returned, and all slaves freed. His first public declaration of mission was: freedom for captives, sight for the blind, liberation for the oppressed. This was not metaphor to a first-century Jewish audience living under Roman occupation and a debt slavery system.`,
    metadata: {
      sourceSlug: 'luke-4-18-19-year-of-jubilee',
      creator: 'Scripture — New Testament / Gospel of Luke',
      date: '~80 AD (describing ~30 AD)',
      collection: 'Holy Bible, ESV',
      rights: 'public_domain',
      topics: ['Jesus', 'Jubilee', 'liberation', 'the poor', 'captives', 'scripture', 'justice'],
      era: 'ancient',
      subjectTracks: ['truth-based-history', 'justice-changemaking'],
      readingLevel: '3-12',
      investigationTypes: ['compare-sources', 'document-analysis'],
      narrativeRole: 'scripture',
      scriptureConnections: [{ passage: 'Isaiah 61:1-2', connection: 'Jesus quotes Isaiah directly — connecting his mission to the prophetic tradition of speaking truth to power' }],
      contentWarnings: [],
      investigationPrompts: [
        'Jesus chose this passage as his first public statement. Given everything in the Hippocampus — slavery, convict leasing, colonialism, lynching — what would it look like for a society to take this mission seriously?',
        'The "year of the Lord\'s favor" (Jubilee) cancelled debts and freed slaves. What institutions in history benefited from those debts and that labor never being cancelled?',
      ],
      citation: 'The Holy Bible, English Standard Version. Luke 4:18-19. Crossway Bibles, 2001.',
    },
  },
];

export async function seedHippocampus(): Promise<void> {
  console.log(`[hippocampus-seed] Seeding ${SOURCES.length} primary sources...`);
  let count = 0;
  for (const source of SOURCES) {
    try {
      await ingestPrimarySource(source);
      count++;
    } catch (err) {
      console.error(`[hippocampus-seed] Failed: ${source.metadata.sourceSlug}`, err);
    }
  }
  console.log(`[hippocampus-seed] Done — ${count}/${SOURCES.length} ingested`);
}

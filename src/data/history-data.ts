export type Category = 
  | 'ALL'
  | 'GOVERNMENT_OP'
  | 'MEDICAL_COVERUP'
  | 'WAR'
  | 'BIBLICAL_COVERUP'
  | 'BIBLICAL'
  | 'US_HISTORY'
  | 'OKLAHOMA_HISTORY'
  | 'NATIVE_AMERICAN'
  | 'HERO';

export type SourceType = 'DECLASSIFIED' | 'LEAKED' | 'CONGRESSIONAL' | 'COURT_RECORD' | 'PRIMARY' | 'ACADEMIC';

export interface Source {
  id?: string;
  type: SourceType;
  title: string;
  url?: string;
  notes?: string;
}

export interface HistoricalEvent {
  id: string;
  type: 'coverup' | 'hero' | 'biblical';
  date: string;
  title: string;
  category: Category;
  tags: string[];
  
  // Narrative vs Reality (Coverups/History)
  narrative?: string;
  reality?: string;
  followTheMoney?: string;
  bodyCount?: number;
  
  // Hero specific
  story?: string;
  impact?: string;
  whyNotCelebrated?: string;
  
  // Biblical specific
  hebrewGreek?: string;
  literalTranslation?: string;
  originalText?: string;
  contextualMeaning?: string;
  scripture?: string;
  significance?: string;
  
  // Media
  videoUrl?: string;
  sources?: Source[];
}

export const allEvents: HistoricalEvent[] = [
  // --- GOVERNMENT OPERATIONS ---
  {
    type: 'coverup',
    id: '1',
    date: '1953-08-19',
    title: 'Operation Ajax: CIA Overthrows Iranian Democracy',
    narrative: 'Popular uprising led to regime change in Iran. The US supported democratic movements.',
    reality: 'CIA and MI6 orchestrated coup to overthrow democratically-elected PM Mossadegh after he nationalized oil. Installed dictator Shah to protect BP oil interests.',
    followTheMoney: 'Anglo-Iranian Oil Company (now BP) kept 40% of Iran\'s oil. US oil companies got 40%. After coup, Western oil companies regained control of Iranian oil for 25 years.',
    bodyCount: 300,
    category: 'GOVERNMENT_OP',
    tags: ['CIA', 'oil', 'coup', 'Iran', 'BP'],
    videoUrl: 'https://www.youtube.com/embed/Q_AHJQiMxIw',
    sources: [{
      type: 'DECLASSIFIED',
      title: 'CIA Confirms Role in 1953 Iran Coup',
      url: 'https://nsarchive2.gwu.edu/NSAEBB/NSAEBB435/',
      notes: 'Declassified CIA documents from 2013 confirm Operation Ajax'
    }]
  },
  {
    type: 'coverup',
    id: '2',
    date: '1953-04-13',
    title: 'MKUltra: CIA Mind Control Experiments',
    narrative: 'The CIA conducted research into interrogation techniques to protect national security.',
    reality: 'CIA illegally drugged unwitting Americans with LSD and other substances. Conducted brutal mind control experiments including sensory deprivation, torture, sexual abuse. Most records destroyed in 1973.',
    followTheMoney: 'CIA spent $10M+ ($87M today). Contracted 80+ institutions including universities, hospitals, prisons.',
    bodyCount: 2,
    category: 'GOVERNMENT_OP',
    tags: ['CIA', 'MKUltra', 'mind-control', 'LSD', 'torture'],
    sources: [{
      type: 'DECLASSIFIED',
      title: 'Senate MKUltra Hearing Documents',
      url: 'https://www.intelligence.senate.gov/resources/intelligence-related-commissions',
      notes: '1977 Church Committee hearings revealed MKUltra'
    }]
  },
  {
    type: 'coverup',
    id: 'gov_3',
    date: '1956-01-01',
    title: 'COINTELPRO: FBI War on Dissent',
    narrative: 'FBI investigation program to track subversive groups threatening domestic security.',
    reality: 'FBI illegally surveilled, infiltrated, and discredited civil rights leaders. Sent MLK a letter urging him to commit suicide. Assassinated Fred Hampton.',
    followTheMoney: 'Maintained the status quo for political elites. Massive FBI budget expansion justified by "domestic threats."',
    category: 'GOVERNMENT_OP',
    tags: ['FBI', 'surveillance', 'civil-rights', 'MLK'],
    sources: [{
        type: 'DECLASSIFIED',
        title: 'COINTELPRO Documents',
        url: 'https://vault.fbi.gov/cointel-pro',
        notes: 'Official FBI Vault records'
    }]
  },
  {
    type: 'coverup',
    id: 'gov_4',
    date: '1962-03-13',
    title: 'Operation Northwoods: Planning False Flags',
    narrative: 'US military drafted plans to protect the nation from Cuban aggression.',
    reality: 'Joint Chiefs proposed false flag attacks on US citizens to justify invading Cuba. Planned to blow up US ships and kill Americans in Miami and DC. JFK rejected it.',
    followTheMoney: 'Military Industrial Complex sought war justification to secure massive defense contracts and control Caribbean trade routes.',
    category: 'GOVERNMENT_OP',
    tags: ['False-Flag', 'Cuba', 'JFK', 'CIA'],
    sources: [{
        type: 'DECLASSIFIED',
        title: 'Northwoods Memorandum',
        url: 'https://nsarchive2.gwu.edu/news/20010430/northwoods.pdf',
        notes: 'Top Secret memorandum from Joint Chiefs of Staff'
    }]
  },
  {
    type: 'coverup',
    id: 'gov_5',
    date: '1985-08-20',
    title: 'Iran-Contra Affair',
    narrative: 'US does not negotiate with terrorists and follows all arms embargoes.',
    reality: 'Reagan admin secretly sold weapons to enemy Iran. Used illegal profits to fund right-wing Nicaraguan death squads (Contras). CIA facilitated cocaine trafficking into US to fund the war.',
    followTheMoney: 'Black budget funding for unauthorized wars. CIA protected drug routes that flooded US inner cities with crack cocaine.',
    category: 'GOVERNMENT_OP',
    tags: ['Reagan', 'Contra', 'CIA', 'Drugs'],
    bodyCount: 30000
  },
  {
    type: 'coverup',
    id: 'gov_6',
    date: '1969-12-04',
    title: 'FBI Assassination of Fred Hampton',
    narrative: 'Black Panthers initiated a shootout with police during a raid.',
    reality: 'Fred Hampton was drugged by an FBI informant (William O\'Neal). He was murdered in his sleep. Police fired 99 shots; Panthers fired 1 (accidental discharge).',
    followTheMoney: 'FBI paid informant O\'Neal $300,000 (adjusted) to infiltrate and set up the hit. Prevented unification of poor working class.',
    category: 'GOVERNMENT_OP',
    tags: ['Black-Panthers', 'FBI', 'Assassination'],
    bodyCount: 2
  },

  // --- MEDICAL COVERUPS ---
  {
    type: 'coverup',
    id: '3',
    date: '1932-05-01',
    title: 'Tuskegee Syphilis Study',
    narrative: 'Medical study to understand disease progression and find better treatments.',
    reality: 'US Public Health Service deliberately withheld treatment from 399 Black men with syphilis for 40 years. Lied to them, denied penicillin even after it became standard cure in 1947.',
    followTheMoney: 'PHS researchers built careers. Got grants, published papers, advanced professionally while subjects died preventable deaths.',
    bodyCount: 128,
    category: 'MEDICAL_COVERUP',
    tags: ['racism', 'medical-ethics', 'PHS', 'syphilis'],
    sources: [{
      type: 'CONGRESSIONAL',
      title: 'CDC Official History',
      url: 'https://www.cdc.gov/tuskegee/index.html',
      notes: 'Government admission and apology'
    }]
  },
  {
    type: 'coverup',
    id: 'med_2',
    date: '1957-10-01',
    title: 'Thalidomide Tragedy',
    narrative: 'A safe, wonder-drug sedative for pregnant women to cure morning sickness.',
    reality: 'Drug companies (Grünenthal) knew early trials showed nerve damage. Buried safety studies. Sold it anyway. 10,000+ babies born with severe limb deformities (phocomelia).',
    followTheMoney: 'Massive profits prioritized over safety testing. Delayed recall to sell remaining stock.',
    bodyCount: 2000,
    category: 'MEDICAL_COVERUP',
    tags: ['Pharma', 'Birth-Defects', 'FDA']
  },
  {
    type: 'coverup',
    id: 'med_3',
    date: '1996-01-01',
    title: 'Oxycontin & Purdue Pharma',
    narrative: 'Oxycontin is a revolutionary "non-addictive" pain management solution due to time-release coating.',
    reality: 'Sackler family knew it was highly addictive. Aggressively marketed it to general practitioners. Created the opioid epidemic.',
    followTheMoney: 'Sackler family made approx $35 billion. Paid fines but kept billions. No family member went to jail.',
    bodyCount: 500000,
    category: 'MEDICAL_COVERUP',
    tags: ['Opioids', 'Sackler', 'Big-Pharma', 'Addiction']
  },
  {
    type: 'coverup',
    id: 'med_4',
    date: '1999-05-20',
    title: 'Vioxx: Merck Knew and Hid Risks',
    narrative: 'A breakthrough anti-inflammatory drug for arthritis with fewer side effects.',
    reality: 'Merck hid data showing it caused heart attacks and strokes. Internal emails: "We may need to seek them out and destroy them where they live" (referring to doctors criticizing the drug).',
    followTheMoney: 'Generated $2.5 billion/year before recall. Fines were a fraction of the profits.',
    bodyCount: 60000,
    category: 'MEDICAL_COVERUP',
    tags: ['Merck', 'Heart-Attack', 'Fraud']
  },
  {
    type: 'coverup',
    id: 'med_5',
    date: '1984-01-01',
    title: 'Bayer Sold HIV-Infected Blood',
    narrative: 'Providing life-saving clotting factor for hemophiliacs.',
    reality: 'Bayer knew a batch of medicine was contaminated with HIV. Pulled it from US market but DUMPED it on Asia and Latin America to clear inventory.',
    followTheMoney: 'Profits from selling contaminated stock outweighed the "cost" of human lives in developing nations.',
    bodyCount: 20000,
    category: 'MEDICAL_COVERUP',
    tags: ['Bayer', 'HIV', 'Scandal']
  },

  // --- WAR LIES ---
  {
    type: 'coverup',
    id: '4',
    date: '1964-08-04',
    title: 'Gulf of Tonkin Incident',
    narrative: 'North Vietnamese attacked US destroyers unprovoked in international waters twice.',
    reality: 'First incident was provoked. Second attack NEVER HAPPENED - confirmed fabrication. NSA documents prove Johnson administration knew and lied to Congress.',
    followTheMoney: 'Defense contractors made $738B+ (adjusted). 58,000 Americans dead, 2-3M Vietnamese dead.',
    bodyCount: 3000000,
    category: 'WAR',
    tags: ['Vietnam', 'false-flag', 'NSA', 'Gulf-of-Tonkin'],
    sources: [{
      type: 'DECLASSIFIED',
      title: 'NSA Gulf of Tonkin Documents',
      url: 'https://nsarchive2.gwu.edu/NSAEBB/NSAEBB132/',
      notes: 'NSA historian admits second attack never occurred'
    }]
  },
  {
    type: 'coverup',
    id: '5',
    date: '2003-03-20',
    title: 'Iraq War: WMDs',
    narrative: 'Iraq had weapons of mass destruction and posed imminent threat.',
    reality: 'Bush administration knew intelligence was fabricated. Downing Street Memo shows "intelligence was fixed around policy".',
    followTheMoney: 'Halliburton got $39.5B no-bid contracts. Cheney was former CEO of Halliburton.',
    bodyCount: 500000,
    category: 'WAR',
    tags: ['Iraq', 'WMD', 'oil', 'Halliburton'],
    sources: [{
      type: 'DECLASSIFIED',
      title: 'Downing Street Memo',
      url: 'https://downingstreetmemo.com/',
      notes: 'UK memo: "intelligence was being fixed around the policy"'
    }]
  },
  {
    type: 'coverup',
    id: 'war_3',
    date: '1945-01-01',
    title: 'Operation Gladio',
    narrative: 'NATO preparing defense networks against potential Soviet invasion.',
    reality: 'CIA/NATO created secret "stay-behind" armies across Europe. Staged terrorist attacks (Bologna bombing) and blamed communists to manipulate elections (Strategy of Tension).',
    followTheMoney: 'Ensured Europe remained under US/NATO political control. Suppressed socialist political movements.',
    bodyCount: 85,
    category: 'WAR',
    tags: ['NATO', 'CIA', 'Terrorism', 'Europe']
  },
  {
    type: 'coverup',
    id: 'war_4',
    date: '1990-10-10',
    title: 'The Nayirah Testimony',
    narrative: 'A 15-year-old Kuwaiti girl testified in tears that Iraqi soldiers threw babies out of incubators.',
    reality: 'Total fabrication. Nayirah was the daughter of the Kuwaiti ambassador. Coached by PR firm Hill+Knowlton.',
    followTheMoney: 'Hill+Knowlton paid $10M+ by Kuwaiti government to sell the Gulf War to the American public.',
    category: 'WAR',
    tags: ['Propaganda', 'Gulf-War', 'PR', 'Lies']
  },
  {
    type: 'coverup',
    id: 'war_5',
    date: '2004-04-22',
    title: 'Pat Tillman Friendly Fire',
    narrative: 'NFL star turned soldier died heroically charging up a hill fighting the Taliban.',
    reality: 'Killed by friendly fire (US troops). Army knew immediately but burned his uniform and diary. Lied to family and public to use his funeral for recruitment propaganda.',
    followTheMoney: 'Used a celebrity death to maintain support for a failing war effort.',
    category: 'WAR',
    tags: ['Afghanistan', 'Propaganda', 'Military-Lies']
  },
  {
    type: 'coverup',
    id: '13',
    date: '1945-08-06',
    title: 'Atomic Bombs on Japan',
    narrative: 'Necessary to end war and save American lives. Japan refused to surrender.',
    reality: 'Japan was already trying to surrender via Soviet channels. US dropped bombs to intimidate Stalin before the Cold War began.',
    followTheMoney: '$2 billion Manhattan Project needed political justification. Launched the profitable Nuclear Arms Race.',
    bodyCount: 200000,
    category: 'WAR',
    tags: ['atomic-bomb', 'Japan', 'Cold-War']
  },

  // --- NATIVE AMERICAN / OKLAHOMA ---
  {
    type: 'coverup',
    id: '20',
    date: '1838-10-01',
    title: 'Trail of Tears',
    narrative: 'Relocation to Oklahoma for their own protection.',
    reality: 'Forced death march. 16,000 Cherokee removed at gunpoint. Lands stolen for Georgia gold rush.',
    followTheMoney: 'White settlers seized 25 million acres. Gold discovered on Cherokee land 1828.',
    bodyCount: 4000,
    category: 'NATIVE_AMERICAN',
    tags: ['Cherokee', 'Trail-of-Tears', 'Genocide'],
    sources: [{
      type: 'PRIMARY',
      title: 'Cherokee Nation Records',
      url: 'https://www.cherokee.org/about-the-nation/history/',
      notes: 'Nation\'s official historical documentation'
    }]
  },
  {
    type: 'coverup',
    id: 'na_2',
    date: '1860-01-01',
    title: 'Indian Boarding Schools',
    narrative: 'Providing education and assimilation opportunities for Native children.',
    reality: 'Motto: "Kill the Indian, save the man." Children stolen from families, hair cut, beaten for speaking native languages. Rampant abuse. Thousands in unmarked graves.',
    followTheMoney: 'Churches and institutions paid by government per head. Destroyed tribal cohesion to make land seizure easier.',
    category: 'NATIVE_AMERICAN',
    tags: ['Genocide', 'Education', 'Assimilation']
  },
  {
    type: 'coverup',
    id: 'na_3',
    date: '1921-01-01',
    title: 'Osage Indian Murders',
    narrative: 'Unfortunate series of deaths in the wealthy Osage nation.',
    reality: 'Osage were richest people per capita due to oil. White "guardians" and locals systematically poisoned, shot, and bombed them to inherit their "headrights" (oil money).',
    followTheMoney: 'Millions of dollars in oil wealth stolen by corrupt white locals, doctors, and law enforcement.',
    bodyCount: 60,
    category: 'OKLAHOMA_HISTORY',
    tags: ['Osage', 'Oil', 'FBI', 'Murder']
  },
  {
    type: 'coverup',
    id: 'na_4',
    date: '1887-02-08',
    title: 'The Dawes Act',
    narrative: 'Giving Native Americans individual private property rights.',
    reality: 'Trap to break up tribal communal land. "Gave" small plots to individuals, then declared the rest "surplus" and sold it to white settlers.',
    followTheMoney: 'Tribes lost 90 million acres (2/3 of all remaining reservation land) to white speculators.',
    category: 'NATIVE_AMERICAN',
    tags: ['Land-Theft', 'Law', 'Colonization']
  },
  {
    type: 'coverup',
    id: '21',
    date: '1921-06-01',
    title: 'Tulsa Race Massacre',
    narrative: 'Race riot occurred after Black man accused of assaulting white woman.',
    reality: 'White mob firebombed "Black Wall Street". Dropped bombs from planes. Killed 300+ Black residents. Bodies dumped in mass graves.',
    followTheMoney: 'White Tulsans seized prime real estate. Black wealth estimated $200M+ destroyed.',
    bodyCount: 300,
    category: 'OKLAHOMA_HISTORY',
    tags: ['Tulsa', 'massacre', 'Greenwood', 'racism']
  },

  // --- BIBLICAL COVERUPS ---
  {
    type: 'coverup',
    id: '7',
    date: '0325-06-19',
    title: 'Council of Nicaea',
    narrative: 'Church leaders met to clarify doctrine and confirm scripture.',
    reality: 'Emperor Constantine convened bishops to create religious unity for political control. Voted on books. Burned "heretical" texts.',
    followTheMoney: 'Constantine needed unified religion to control empire. Church gained imperial power.',
    category: 'BIBLICAL_COVERUP',
    tags: ['Nicaea', 'Constantine', 'Canon']
  },
  {
    type: 'coverup',
    id: 'bib_2',
    date: '0405-01-01',
    title: '"Lucifer" Mistranslation',
    narrative: 'Lucifer is the proper name of Satan before he fell.',
    reality: 'Isaiah 14:12 in Hebrew says "helel ben shachar" (morning star/Venus). Jerome translated it to Latin "Lucifer" (light-bringer). It was a taunt against the King of Babylon, not a proper name for the devil.',
    followTheMoney: 'Created a mythology that distracted from the text\'s actual warning about human arrogance and kings.',
    category: 'BIBLICAL_COVERUP',
    tags: ['Translation', 'Latin', 'Jerome']
  },
  {
    type: 'coverup',
    id: 'bib_4',
    date: '1600-01-01',
    title: 'Hell / Sheol / Hades',
    narrative: 'The Bible clearly describes one place of eternal fire called Hell.',
    reality: 'Translators conflated 3 different words: "Sheol" (grave), "Hades" (underworld), and "Gehenna" (actual burning garbage dump outside Jerusalem).',
    followTheMoney: 'The threat of eternal torture was a powerful tool for the institutional church to sell indulgences and maintain control through fear.',
    category: 'BIBLICAL_COVERUP',
    tags: ['Hell', 'Translation', 'Fear-mongering']
  },

  // --- BIBLICAL EVENTS ---
  {
    type: 'biblical',
    id: '10',
    date: '0030-04-03',
    title: 'The Resurrection',
    hebrewGreek: 'ἀνάστασις (anastasis)',
    literalTranslation: 'A standing up again, rising from the dead',
    originalText: 'Ἀναστὰς δὲ πρωῒ πρώτῃ σαββάτου...',
    contextualMeaning: 'Physical bodily resurrection. The tomb was empty.',
    scripture: 'Mark 16:9',
    significance: 'Death defeated. Promise of bodily resurrection.',
    category: 'BIBLICAL',
    tags: ['resurrection', 'Jesus', 'gospel']
  },

  // --- HEROES ---
  {
    type: 'hero',
    id: '16',
    date: '1943-01-01',
    title: 'Irena Sendler',
    story: 'Polish nurse smuggled 2,500 Jewish children out of Warsaw Ghetto in coffins and toolboxes.',
    impact: 'Saved 2,500 lives.',
    whyNotCelebrated: 'Communist Poland suppressed her story.',
    category: 'HERO',
    tags: ['Holocaust', 'Poland', 'Rescue']
  },
  {
    type: 'hero',
    id: 'hero_2',
    date: '1983-09-26',
    title: 'Stanisław Petrov',
    story: 'Soviet duty officer saw early warning system report 5 incoming US nuclear missiles. He trusted his gut that it was a false alarm and disobeyed orders to report it.',
    impact: 'Prevented full-scale nuclear war. Saved the world.',
    whyNotCelebrated: 'Soviet military disciplined him for not following protocol. He died in poverty.',
    category: 'HERO',
    tags: ['Cold-War', 'Nuclear', 'Courage']
  },
  {
    type: 'hero',
    id: 'hero_3',
    date: '1940-09-19',
    title: 'Witold Pilecki',
    story: 'Polish cavalry officer who VOLUNTEERED to get arrested and sent to Auschwitz to gather intelligence. Escaped after 2.5 years.',
    impact: 'First person to report on the Holocaust to the Allies.',
    whyNotCelebrated: 'Executed by Communist secret police in 1948 as a "western spy". Records sealed until 1990s.',
    category: 'HERO',
    tags: ['Auschwitz', 'Intel', 'Sacrifice']
  },
  {
    type: 'hero',
    id: 'hero_4',
    date: '1962-10-27',
    title: 'Vasili Arkhipov',
    story: 'Soviet submarine flotilla chief. During Cuban Missile Crisis, his sub was depth-charged. Captain wanted to launch nuclear torpedo. Arkhipov cast the veto vote.',
    impact: 'Prevented nuclear war when tensions were highest.',
    whyNotCelebrated: 'Russian navy was embarrassed they almost started WW3.',
    category: 'HERO',
    tags: ['Cuban-Missile-Crisis', 'Nuclear', 'Submarine']
  }
];

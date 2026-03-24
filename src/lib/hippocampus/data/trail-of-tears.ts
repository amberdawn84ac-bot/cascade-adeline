import { IngestPrimarySourceInput } from '../types';

export const trailOfTearsSources: IngestPrimarySourceInput[] = [
  {
    title: "President Andrew Jackson's Message to Congress On Indian Removal",
    content: "It gives me pleasure to announce to Congress that the benevolent policy of the Government, steadily pursued for nearly thirty years, in relation to the removal of the Indians beyond the white settlements is approaching to a happy consummation. The consequences of a speedy removal will be important to the United States, to individual States, and to the Indians themselves. It will place a dense and civilized population in large tracts of country now occupied by a few savage hunters.",
    metadata: {
      sourceSlug: "jackson-removal-message-1830",
      creator: "Andrew Jackson",
      date: "1830-12-06",
      rights: "public_domain",
      topics: ["Indian Removal Act", "Trail of Tears", "Federal Policy", "Oklahoma"],
      era: "Jacksonian Era",
      subjectTracks: ["history"],
      investigationTypes: ["propaganda-analysis", "compare-sources"],
      narrativeRole: "government_record",
      scriptureConnections: [],
      contentWarnings: ["Racism", "Cultural Erasure"],
      investigationPrompts: ["How does Jackson use language to frame the forced removal as a 'benevolent policy'?"],
      citation: "Jackson, Andrew. Message to Congress, Dec 6, 1830. Records of the US Senate."
    }
  },
  {
    title: "Private John G. Burnett's Story of the Removal of the Cherokees",
    content: "I saw the helpless Cherokees arrested and dragged from their homes, and driven at the bayonet point into the stockades. And in the chill of a drizzling rain on an October morning I saw them loaded like cattle or sheep into six hundred and forty-five wagons and started toward the west. Many of these helpless people did not have blankets and many of them had been driven from home barefooted... The trail of the exiles was a trail of death.",
    metadata: {
      sourceSlug: "burnett-eyewitness-1890",
      creator: "John G. Burnett",
      date: "1890-12-11",
      rights: "public_domain",
      topics: ["Trail of Tears", "Cherokee Nation", "Military Enforcement", "Oklahoma"],
      era: "Jacksonian Era",
      subjectTracks: ["history"],
      investigationTypes: ["compare-sources", "document-analysis"],
      narrativeRole: "eyewitness",
      scriptureConnections: [],
      contentWarnings: ["Violence", "Death", "Human Rights Abuses"],
      investigationPrompts: ["Contrast Burnett's eyewitness description of the events with President Jackson's claims of benevolence."],
      citation: "Burnett, John G. Birthday Story, Dec 11, 1890."
    }
  }
];

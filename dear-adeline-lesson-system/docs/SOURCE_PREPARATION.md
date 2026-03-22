# Source Preparation Guide

## Overview

Primary sources are the heart of Dear Adeline's investigative learning. This guide explains how to find, prepare, chunk, and store source materials for use in dynamic lessons.

## Finding Primary Sources

### 1. Government Archives & Libraries
**Free, public domain sources:**
- **Library of Congress** (loc.gov) - Photos, documents, maps
- **National Archives** (archives.gov) - Government records, treaties, legislation
- **State Archives** - Local/regional history documents
- **Smithsonian Open Access** - Museum artifacts, photos
- **Internet Archive** (archive.org) - Books, newspapers, recordings

**Oklahoma-specific:**
- Oklahoma Historical Society
- Five Civilized Tribes Museum Archives
- Gilcrease Museum (Tulsa)
- Cherokee Heritage Center

### 2. Academic Databases
- **JSTOR** - Historical journals, primary source collections
- **HathiTrust** - Digitized books and documents
- **ProQuest Historical Newspapers**
- **Chronicling America** - Historic American newspapers

### 3. Specialized Collections

**Native American History:**
- Dawes Rolls (searchable online at AccessGenealogy.com)
- Indian Land Tenure Foundation
- National Museum of the American Indian

**Corporate/Economic Investigation:**
- SEC EDGAR database (company filings)
- OpenSecrets.org (political donations, lobbying)
- Annual reports from corporate websites
- Historical newspaper business sections

**Agricultural/Food Systems:**
- USDA historical records
- Farm Security Administration photos
- Agricultural extension bulletins
- Historical seed catalogs

## Source Evaluation Criteria

Before using a source, verify:

✅ **Authenticity** - Is this actually from the claimed time period/creator?
✅ **Provenance** - Where did this come from? Who digitized/preserved it?
✅ **Rights** - Can we legally use this? (Public domain, fair use, Creative Commons)
✅ **Completeness** - Do we have the full document or just excerpts?
✅ **Context** - What was happening when this was created?

## Chunking Strategy

Primary sources need to be broken into **semantic chunks** that:
1. Maintain complete thoughts/ideas
2. Are small enough to retrieve relevant portions
3. Include enough context to stand alone
4. Preserve critical metadata

### Document Chunking

**Full legislative documents** (like the Dawes Act):
```
Chunk 1: Title and preamble (purpose statement)
Chunk 2: Section 1 (first major provision)
Chunk 3: Section 2 (next major provision)
... continue by section
Chunk N: Final provisions and signatures
```

**Longer documents** (letters, journals):
- Chunk by paragraph or logical thought
- Each chunk should be 200-500 words
- Overlap chunks by 1-2 sentences for context

**Newspaper articles:**
- Headline + lead paragraph = Chunk 1
- Body paragraphs = Chunk 2-N
- Keep related paragraphs together

### Photo/Visual Chunking

For photographs and visual materials:
```json
{
  "visual_content": "base64_or_url",
  "caption": "What the photo shows",
  "metadata": {
    "date": "1903",
    "photographer": "Unknown",
    "location": "Tahlequah, Indian Territory",
    "subjects": ["Cherokee family", "log cabin", "farming"]
  },
  "analysis_points": [
    "Type of housing",
    "Evidence of farming activity",
    "Family composition visible"
  ]
}
```

### Audio/Video Chunking

- Transcribe first using Whisper or similar
- Chunk transcript by topic change or speaker change
- Timestamp each chunk for reference back to original

## Metadata Schema

Every source chunk needs this metadata:

```json
{
  "source_id": "unique-identifier",
  "source_type": "document|photo|audio|video|artifact",
  "title": "Descriptive title",
  "creator": "Who made this",
  "date": "When it was created",
  "date_digitized": "When we digitized/found it",
  "location": "Where it was created",
  "collection": "Which archive/library",
  "url": "Link to original",
  "rights": "public_domain|fair_use|cc_by",
  "subjects": ["topic", "tags"],
  "era": "time_period",
  "relevance_to_tracks": {
    "truth-based-history": 10,
    "justice-changemaking": 8,
    "government-economics": 7
  },
  "scripture_connections": [
    {
      "passage": "Leviticus 25:23",
      "connection": "Land ownership principle violated"
    }
  ],
  "content_warnings": [], // If any
  "reading_level": "6-8", // Grade level
  "chunk_text": "The actual content...",
  "context": "Background info students need"
}
```

## Processing Workflow

### 1. Acquisition
- Download/photograph source
- Save in highest quality available
- Note where found and access date

### 2. Verification
- Cross-reference with other sources
- Verify authenticity
- Document any questions/uncertainties

### 3. Transcription (if needed)
- Type out handwritten documents
- Use OCR for printed text (proofread carefully!)
- Maintain original spelling/grammar
- Note [illegible] or [unclear] where needed

### 4. Chunking
- Break into semantic units
- Add metadata to each chunk
- Create embeddings for semantic search

### 5. Storage
Upload to Supabase with:
```sql
INSERT INTO sources (
  source_id,
  source_type,
  title,
  creator,
  date,
  collection,
  url,
  rights,
  metadata,
  chunk_text,
  embedding
) VALUES (...);
```

## Citation Requirements

Always include complete citation info:
```
[Creator]. ([Date]). [Title]. [Collection], [Institution]. Retrieved from [URL]
```

Example:
```
Unknown photographer. (ca. 1903). Cherokee family on their allotment near Tahlequah. 
Library of Congress, Prints & Photographs Division. Retrieved from 
https://www.loc.gov/item/2004665432/
```

## Special Considerations

### For Students Ages 10-15

**Content warnings needed for:**
- Graphic violence or trauma
- Racist/offensive language (historical)
- Disturbing imagery

**How to handle:**
- Don't censor history, but provide context
- Prepare students beforehand
- Offer alternative sources if too disturbing
- Discuss why such language/imagery was used historically

### Fair Use Guidelines

We can use copyrighted materials for education under fair use when:
- Used for teaching/scholarship
- Amount used is limited
- Doesn't replace the original
- Transformative (we're analyzing, not just reproducing)

**But always prefer public domain when possible.**

## Quality Checklist

Before adding a source to The Hippocampus:

- [ ] Verified authenticity
- [ ] Checked rights/permissions
- [ ] Added complete metadata
- [ ] Chunked appropriately
- [ ] Created embeddings
- [ ] Tested retrieval
- [ ] Documented source location
- [ ] Created proper citation
- [ ] Identified Scripture connections
- [ ] Tagged for subject tracks

---

**Remember:** Primary sources are what makes Dear Adeline different. Students investigate original materials instead of trusting someone else's interpretation. Quality sources = quality learning.

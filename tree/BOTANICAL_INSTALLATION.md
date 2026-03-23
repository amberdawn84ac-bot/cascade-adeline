# 🌿 Botanical Tree Visualization - Installation Guide

## What's New

Beautiful vintage botanical illustration style trees inspired by your reference image!

### Changes from Original:
- ❌ Removed: Cartoony vector graphics
- ✅ Added: Watercolor leaf clusters
- ✅ Added: Cross-hatched pencil trunk texture
- ✅ Added: Delicate white flowers on mastered branches
- ✅ Added: Vintage scroll label plaques
- ✅ Added: Cream parchment background
- ✅ Added: Decorative flourishes
- ✅ Added: Sketched grass with tiny wildflowers
- ✅ Added: "Dear Adeline" signature

---

## Files to Install (9 Total)

### New Botanical Components:
1. **filters.tsx** → `src/components/tree/botanical/filters.tsx`
   - SVG filters for watercolor, pencil sketch, parchment texture
   - Muted botanical color palette for your 8 tracks

2. **components.tsx** → `src/components/tree/botanical/components.tsx`
   - LeafCluster (watercolor style with veins)
   - FlowerCluster (5-petal white flowers)
   - ScrollLabel (vintage plaque banners)
   - TreeTrunk (cross-hatched bark)
   - SketchedGrass (loose strokes + wildflowers)
   - ScrollFlourish (decorative corner scrolls)

### Updated Tree Files:
3. **SeedlingTree.tsx** → `src/components/tree/trees/SeedlingTree.tsx` (K-2)
4. **YoungTree.tsx** → `src/components/tree/trees/YoungTree.tsx` (3-5)
5. **GrowingTree.tsx** → `src/components/tree/trees/GrowingTree.tsx` (6-8)
6. **MatureOak.tsx** → `src/components/tree/trees/MatureOak.tsx` (9-12)

### No Changes Needed:
7. **TreeVisualization.tsx** (main component - already compatible)
8. **route.ts** (API endpoint - already compatible)
9. **TREE_VISUALIZATION_GUIDE.md** (documentation)

---

## Installation

### Option 1: Copy Files Directly

```bash
# Create directories
mkdir -p src/components/tree/botanical
mkdir -p src/components/tree/trees
mkdir -p src/app/api/tree

# Copy botanical components
cp tree/botanical/filters.tsx src/components/tree/botanical/
cp tree/botanical/components.tsx src/components/tree/botanical/

# Copy tree visualizations
cp tree/trees/*.tsx src/components/tree/trees/

# Copy API (if not already there)
cp route.ts src/app/api/tree/

# Copy main component (if not already there)
cp tree/TreeVisualization.tsx src/components/tree/

# Copy documentation
cp TREE_VISUALIZATION_GUIDE.md .
```

### Option 2: Give to Windsurf

```
I have the botanical tree visualization system with vintage illustration styling.

Please install these files:

NEW BOTANICAL COMPONENTS:
- tree/botanical/filters.tsx → src/components/tree/botanical/filters.tsx
- tree/botanical/components.tsx → src/components/tree/botanical/components.tsx

UPDATED TREES:
- tree/trees/SeedlingTree.tsx → src/components/tree/trees/SeedlingTree.tsx
- tree/trees/YoungTree.tsx → src/components/tree/trees/YoungTree.tsx
- tree/trees/GrowingTree.tsx → src/components/tree/trees/GrowingTree.tsx
- tree/trees/MatureOak.tsx → src/components/tree/trees/MatureOak.tsx

The TreeVisualization.tsx and route.ts should already be in place from before.

Then create the page and navigation as described in TREE_VISUALIZATION_GUIDE.md
```

---

## What Each Tree Looks Like

### 🌱 Seedling (K-2)
- 8 simple shoots emerging from seed
- Large watercolor leaves (5 per shoot)
- Simple curved stems
- White flowers on mastered shoots
- Shortened labels (first word only for young readers)

### 🌳 Young Tree (3rd-5th)
- Proper tree with cross-hatched trunk
- 8 main branches
- Medium leaf clusters (8 leaves each)
- Vintage scroll labels
- Decorative corner flourishes
- Progress oval in trunk

### 🌲 Growing Tree (6th-8th)
- Thicker trunk with detailed bark
- 8 main branches + secondary branches
- Multiple leaf clusters per branch
- Dense flowers on mastered branches
- Decorative border frame

### 🌳 Mature Oak (9th-12th)
- Thick mature trunk
- 8 main branches + secondaries + tertiaries
- Dense, complex leaf clusters
- Abundant flowers
- "To Graduation" progress tracker
- Decorative border + flourishes

---

## Color Palette (Muted Botanicals)

Each of your 8 tracks has a watercolor palette:

- **God's Creation & Science**: Sage greens (#7FA663)
- **Health & Naturopathy**: Warm terracotta (#E8A87C)
- **Food Systems**: Golden wheat (#D4A574)
- **Government & Economics**: Taupe (#9B8B7E)
- **Justice & Change-Making**: Dusty rose (#C97676)
- **Discipleship & Discernment**: Saddle brown (#8B7355)
- **Truth-Based History**: Antique brass (#B8956A)
- **English & Literature**: Muted purple (#7B6B8F)

Leaves fade from pale tertiary → medium secondary → dark primary as mastery increases.

---

## Features

✅ **Watercolor washes** - SVG turbulence filter creates organic paint texture  
✅ **Pencil cross-hatching** - Realistic bark texture  
✅ **White flower blooms** - 5-petal flowers appear when standards mastered  
✅ **Vintage scroll labels** - Decorative plaques with raised ends  
✅ **Parchment background** - Cream paper with subtle texture  
✅ **Sketched grass** - Loose strokes with tiny wildflowers  
✅ **Decorative flourishes** - Corner scrollwork  
✅ **Natural imperfections** - Nothing is perfectly symmetrical  
✅ **Dear Adeline signature** - Bottom right corner  

---

## Typography

- **Title**: Amatic SC (hand-lettered feel)
- **Labels**: Amatic SC uppercase
- **Progress**: Permanent Marker (playful but readable)
- **Subtitle**: Kalam italic

All fonts are already in your design system!

---

## Next Steps

1. Install the files
2. Visit `/tree` to see the botanical beauty
3. Click branches to explore
4. Watch flowers bloom as standards are mastered! 🌸

This is the vintage field journal aesthetic you've been building. Not a computer game - a naturalist's sketchbook! 🌿

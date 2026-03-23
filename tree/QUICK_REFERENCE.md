# 📁 File Placement Quick Reference

## Where Each File Goes:

### 1. API Endpoint
**File:** `route.ts`  
**→ Goes to:** `src/app/api/tree/route.ts`

### 2. Main Component  
**File:** `TreeVisualization.tsx`  
**→ Goes to:** `src/components/tree/TreeVisualization.tsx`

### 3. Seedling Tree (K-2)
**File:** `SeedlingTree.tsx`  
**→ Goes to:** `src/components/tree/trees/SeedlingTree.tsx`

### 4. Young Tree (3-5)
**File:** `YoungTree.tsx`  
**→ Goes to:** `src/components/tree/trees/YoungTree.tsx`

### 5. Growing Tree (6-8)
**File:** `GrowingTree.tsx`  
**→ Goes to:** `src/components/tree/trees/GrowingTree.tsx`

### 6. Mature Oak (9-12)
**File:** `MatureOak.tsx`  
**→ Goes to:** `src/components/tree/trees/MatureOak.tsx`

### 7. Documentation
**File:** `TREE_VISUALIZATION_GUIDE.md`  
**→ Goes to:** Root of your repo

---

## After Copying Files:

### Create Tree Page
**Create new file:** `src/app/(routes)/tree/page.tsx`

```typescript
import { TreeVisualization } from '@/components/tree/TreeVisualization';

export default function TreePage() {
  return (
    <div className="container mx-auto py-8">
      <TreeVisualization />
    </div>
  );
}
```

### Add to Navigation
In your nav component, add:
```tsx
<Link href="/tree">🌳 My Learning Tree</Link>
```

### Run Migration
```bash
npx prisma db push
```

---

## Give This to Windsurf:

```
I have 7 files for the tree visualization system.

Please place them in these exact locations:
1. route.ts → src/app/api/tree/route.ts
2. TreeVisualization.tsx → src/components/tree/TreeVisualization.tsx
3. SeedlingTree.tsx → src/components/tree/trees/SeedlingTree.tsx
4. YoungTree.tsx → src/components/tree/trees/YoungTree.tsx
5. GrowingTree.tsx → src/components/tree/trees/GrowingTree.tsx
6. MatureOak.tsx → src/components/tree/trees/MatureOak.tsx
7. TREE_VISUALIZATION_GUIDE.md → root directory

Then:
- Create src/app/(routes)/tree/page.tsx that renders TreeVisualization
- Add navigation link to /tree
- Run: npx prisma db push

Done!
```

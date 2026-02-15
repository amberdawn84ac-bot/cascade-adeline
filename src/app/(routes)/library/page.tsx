import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { MagnifyingGlass } from '@/components/illustrations';
import { LibraryClient, LibraryDoc } from '@/components/library/LibraryClient';

const CREAM = '#FFFEF7';
const PALM = '#2F4731';

export default async function LibraryPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/login');
  }

  const docs = await prisma.hippocampusDocument.findMany({
    orderBy: [{ title: 'asc' }, { chunkIndex: 'asc' }],
    select: { id: true, title: true, sourceType: true, createdAt: true, chunkIndex: true },
  });

  const initialDocs: LibraryDoc[] = docs.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div
      style={{
        minHeight: '100vh',
        background: CREAM,
        padding: '90px 20px 40px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        color: '#121B13',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <MagnifyingGlass size={36} color={PALM} />
        <div>
          <div style={{ fontFamily: '"Emilys Candy", cursive', color: PALM, fontSize: '1.6rem' }}>Hippocampus Library</div>
          <div style={{ color: '#4B3424' }}>Upload research and primary sources for Adeline to learn from.</div>
        </div>
      </header>

      <LibraryClient initialDocs={initialDocs} />
    </div>
  );
}

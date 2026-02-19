import { Feather } from 'lucide-react';
import { RoomStub } from '@/components/dashboard/RoomStub';
export default function ElaPage() {
  return <RoomStub title="The Scriptorium" subtitle="Rhetoric & Communication" description="Write stories, analyze texts, and build your portfolio." icon={Feather} color="border-rose-500/20 bg-rose-500/5" />;
}

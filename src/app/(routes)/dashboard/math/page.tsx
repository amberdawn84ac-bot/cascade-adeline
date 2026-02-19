import { Calculator } from 'lucide-react';
import { RoomStub } from '@/components/dashboard/RoomStub';
export default function MathPage() {
  return <RoomStub title="The Counting House" subtitle="Applied Math & Business" description="Manage your business, calculate profits, and master algebra." icon={Calculator} color="border-amber-500/20 bg-amber-500/5" />;
}

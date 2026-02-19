import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

export function RoomStub({ title, subtitle, description, icon: Icon, color }: Props) {
  return (
    <div className="space-y-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#2F4731]/60 hover:text-[#2F4731] font-bold text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Rooms
      </Link>
      <div className={`rounded-[2rem] p-12 text-center space-y-6 border-2 ${color}`}>
        <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
          <Icon size={40} className="text-[#BD6809]" />
        </div>
        <h1 className="text-4xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          {title}
        </h1>
        <p className="text-[#2F4731]/60 font-bold uppercase tracking-widest text-sm">{subtitle}</p>
        <p className="text-[#2F4731]/80 max-w-md mx-auto leading-relaxed">{description}</p>
        <div className="inline-block px-6 py-3 bg-[#BD6809]/10 border-2 border-[#BD6809]/30 rounded-2xl text-[#BD6809] font-bold text-sm">
          This room is being furnished — check back soon!
        </div>
      </div>
    </div>
  );
}

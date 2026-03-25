import Image from 'next/image';
import { getSessionUser } from '@/lib/auth';

export default async function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  
  return (
    <div className="relative min-h-screen">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
        <Image
          src="/adeline-watermark.png"
          alt=""
          width={800}
          height={800}
          className="select-none object-contain"
          priority={false}
        />
      </div>
      
      {/* Content - Children pages render here */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}


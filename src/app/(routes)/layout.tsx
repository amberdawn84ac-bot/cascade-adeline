import { AppSidebar } from '@/components/nav/AppSidebar';
import Image from 'next/image';

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSidebar>
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
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </AppSidebar>
  );
}

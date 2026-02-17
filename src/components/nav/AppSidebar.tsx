"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MessageCircle, 
  Library, 
  GraduationCap, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Chat with Adeline', href: '/chat', icon: MessageCircle },
  { label: 'Library', href: '/library', icon: Library },
  { label: 'Parent Portal', href: '/parent', icon: GraduationCap },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFEF7] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[#E7DAC3] bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image 
            src="/adeline-nav.png" 
            alt="Adeline" 
            width={32} 
            height={32} 
            className="rounded-lg -rotate-3 shadow-sm"
          />
          <span className="font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
            Dear Adeline
          </span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-[#2F4731]">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#FFFDF5] border-r border-[#E7DAC3] transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen sticky top-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo (Desktop) */}
          <div className="hidden md:flex items-center gap-3 mb-10 px-2">
            <Image 
              src="/adeline-nav.png" 
              alt="Adeline" 
              width={48} 
              height={48} 
              className="rounded-xl -rotate-3 shadow-md border-2 border-white"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xl text-[#2F4731] leading-none" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
                Dear Adeline
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#BD6809] mt-1">
                Academy
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-[#2F4731] text-white shadow-lg shadow-[#2F4731]/20 font-bold" 
                      : "text-[#2F4731]/70 hover:bg-[#2F4731]/5 hover:text-[#2F4731] font-medium"
                  )}
                >
                  <Icon size={20} className={cn("transition-transform group-hover:scale-110", isActive && "text-[#BD6809]")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto pt-6 border-t border-[#E7DAC3] space-y-2">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#2F4731]/60 hover:text-[#2F4731] transition-colors"
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#6B1D2A]/80 hover:text-[#6B1D2A] transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen scroll-smooth">
        {children}
      </main>
    </div>
  );
}

export default function DashboardChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6 md:-m-8 h-screen overflow-hidden">
      {children}
    </div>
  );
}

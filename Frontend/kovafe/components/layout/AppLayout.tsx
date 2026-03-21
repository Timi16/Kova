import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="lg:ml-60 pt-[60px] pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

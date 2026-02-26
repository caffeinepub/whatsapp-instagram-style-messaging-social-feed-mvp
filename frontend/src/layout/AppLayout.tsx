import { type ReactNode } from 'react';
import PrimaryNav from '../navigation/PrimaryNav';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/generated/app-logo.dim_512x512.png" 
            alt="Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold">ChatApp</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="mt-8">
              <PrimaryNav />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r bg-card md:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-16 items-center gap-3 border-b px-6">
              <img 
                src="/assets/generated/app-logo.dim_512x512.png" 
                alt="Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold">ChatApp</span>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
              <PrimaryNav />
            </div>
            <footer className="border-t p-4 text-center text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()}</p>
              <p className="mt-1">
                Built with ❤️ using{' '}
                <a
                  href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </footer>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto h-full max-w-4xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <PrimaryNav mobile />
      </nav>
    </div>
  );
}

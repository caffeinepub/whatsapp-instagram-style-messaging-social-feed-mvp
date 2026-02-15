import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Search, MessageCircle, PlusSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PrimaryNavProps {
  mobile?: boolean;
}

export default function PrimaryNav({ mobile = false }: PrimaryNavProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const navItems = [
    { path: '/', label: 'Feed', icon: Home },
    { path: '/explore', label: 'Explore', icon: Search },
    { path: '/create', label: 'Create', icon: PlusSquare },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  if (mobile) {
    return (
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-12 w-12',
                  isActive && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="space-y-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}

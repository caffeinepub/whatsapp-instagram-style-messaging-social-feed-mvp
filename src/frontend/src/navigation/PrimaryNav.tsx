import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Film,
  Home,
  MessageCircle,
  Phone,
  PlusSquare,
  Radio,
  Search,
  User,
  Users,
} from "lucide-react";

interface PrimaryNavProps {
  mobile?: boolean;
}

export default function PrimaryNav({ mobile = false }: PrimaryNavProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const navItems = [
    { path: "/", label: "Feed", icon: Home },
    { path: "/explore", label: "Explore", icon: Search },
    { path: "/create", label: "Create", icon: PlusSquare },
    { path: "/messages", label: "Messages", icon: MessageCircle },
    { path: "/groups", label: "Groups", icon: Users },
    { path: "/movies", label: "Movies", icon: Film },
    { path: "/live", label: "Live", icon: Radio },
    { path: "/calls", label: "Calls", icon: Phone },
    { path: "/profile", label: "Profile", icon: User },
  ];

  if (mobile) {
    return (
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.path ||
            (item.path !== "/" && currentPath.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
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
        const isActive =
          currentPath === item.path ||
          (item.path !== "/" && currentPath.startsWith(item.path));
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
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

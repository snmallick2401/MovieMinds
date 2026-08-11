import {
  BarChart3,
  Compass,
  House,
  Library,
  MessagesSquare,
  UserRound,
  LayoutList,
  Users,
  Bell,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/feed", label: "Feed", icon: LayoutList },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/people", label: "People", icon: Users },
  { href: "/library", label: "My Library", icon: Library },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

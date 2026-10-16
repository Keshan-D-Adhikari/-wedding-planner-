import {
  Armchair,
  House,
  ListChecks,
  Settings,
  Share2,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  /** Shorter label for the mobile bottom bar */
  shortLabel: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar (max 5) */
  inBottomNav: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', shortLabel: 'Home', icon: House, inBottomNav: true },
  {
    to: '/checklist',
    label: 'Checklist',
    shortLabel: 'Tasks',
    icon: ListChecks,
    inBottomNav: true,
  },
  { to: '/budget', label: 'Budget', shortLabel: 'Budget', icon: Wallet, inBottomNav: true },
  { to: '/guests', label: 'Guest list', shortLabel: 'Guests', icon: Users, inBottomNav: true },
  {
    to: '/seating',
    label: 'Seating chart',
    shortLabel: 'Seating',
    icon: Armchair,
    inBottomNav: true,
  },
  { to: '/export', label: 'Export & share', shortLabel: 'Share', icon: Share2, inBottomNav: false },
  {
    to: '/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: Settings,
    inBottomNav: false,
  },
];

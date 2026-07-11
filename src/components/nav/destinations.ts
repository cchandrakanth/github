import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export interface Destination {
  name: string; // Expo Router screen name inside (tabs)
  href: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconActive: ComponentProps<typeof Ionicons>['name'];
}

export const destinations: Destination[] = [
  { name: 'index', href: '/', title: 'Notes', icon: 'document-text-outline', iconActive: 'document-text' },
  { name: 'search', href: '/search', title: 'Search', icon: 'search-outline', iconActive: 'search' },
  { name: 'reminders', href: '/reminders', title: 'Reminders', icon: 'alarm-outline', iconActive: 'alarm' },
  { name: 'settings', href: '/settings', title: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

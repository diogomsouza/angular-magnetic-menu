import { NavigationExtras } from '@angular/router';

export type MagneticMenuSide = 'left' | 'right';
export type MagneticMenuTheme = 'light' | 'dark' | 'auto';

export type MagneticMenuRouterLink = string | readonly unknown[];

export interface MagneticMenuItem {
  id: string;
  label: string;
  icon?: string;
  iconClass?: string;
  count?: number | string;
  visible?: boolean;
  disabled?: boolean;
  tooltip?: string;
  routerLink?: MagneticMenuRouterLink;
  routerExtras?: NavigationExtras;
  exact?: boolean;
  action?: string;
  ariaLabel?: string;
}

export interface MagneticMenuSection {
  id: string;
  title?: string;
  visible?: boolean;
  items: MagneticMenuItem[];
}

export interface MagneticMenuModel {
  sections: MagneticMenuSection[];
}

export type MagneticMenuInput =
  | MagneticMenuModel
  | MagneticMenuSection[]
  | MagneticMenuItem[];

export interface MagneticMenuItemEvent {
  item: MagneticMenuItem;
  section: MagneticMenuSection;
}

export interface MagneticMenuDragEvent {
  progress: number;
  size: number;
  opened: boolean;
}

export type MagneticMenuItemUpdate = Partial<Omit<MagneticMenuItem, 'id'>>;

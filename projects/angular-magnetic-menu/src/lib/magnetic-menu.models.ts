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

export interface MagneticMenuFooterUser {
  label: string;
  subtitle?: string;
  avatarText?: string;
  avatarUrl?: string;
}

export interface MagneticMenuFooterAction {
  id: string;
  label: string;
  icon?: string;
  iconClass?: string;
  hint?: string;
  visible?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  ariaLabel?: string;
}

export interface MagneticMenuFooterMenu {
  label: string;
  icon?: string;
  iconClass?: string;
  ariaLabel?: string;
  user?: MagneticMenuFooterUser;
  items: MagneticMenuFooterAction[];
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

export interface MagneticMenuFooterActionEvent {
  item: MagneticMenuFooterAction;
}

export interface MagneticMenuDragEvent {
  progress: number;
  size: number;
  opened: boolean;
}

export type MagneticMenuItemUpdate = Partial<Omit<MagneticMenuItem, 'id'>>;

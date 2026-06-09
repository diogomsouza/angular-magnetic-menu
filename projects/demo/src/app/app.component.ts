import { Component, ViewChild } from '@angular/core';
import {
  MagneticMenuFooterActionEvent,
  MagneticMenuFooterMenu,
  MagneticMenuItemEvent,
  MagneticMenuSection,
  StagyraMagneticMenuComponent,
} from '@stagyra/angular-magnetic-menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StagyraMagneticMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild(StagyraMagneticMenuComponent)
  private magneticMenu?: StagyraMagneticMenuComponent;

  opened = typeof window === 'undefined' ? true : window.innerWidth >= 760;
  side: 'left' | 'right' = 'left';
  theme: 'light' | 'dark' = 'light';
  dragEnabled = true;
  clickToToggle = true;
  activeItemId = 'all';
  hiddenDesign = false;
  customItemIndex = 1;
  lastAction = 'All selected';

  get footerMenu(): MagneticMenuFooterMenu {
    return {
      label: 'Settings',
      icon: 'settings',
      ariaLabel: 'Account and settings',
      user: {
        label: 'diogomsouza@gmail.com',
        subtitle: 'Personal account',
        avatarText: 'D',
      },
      items: [
        { id: 'profile', label: 'Profile', icon: 'account_circle' },
        { id: 'settings', label: 'Settings', icon: 'settings', hint: 'Ctrl+,' },
        {
          id: 'theme',
          label: this.theme === 'dark' ? 'Light theme' : 'Dark theme',
          icon: this.theme === 'dark' ? 'light_mode' : 'dark_mode',
        },
        { id: 'usage', label: 'Usage remaining', icon: 'speed', hint: '10%', separatorBefore: true },
        { id: 'logout', label: 'Log out', icon: 'logout', separatorBefore: true },
      ],
    };
  }

  readonly menuItems: MagneticMenuSection[] = [
    {
      id: 'opportunities',
      items: [
        { id: 'all', label: 'All', icon: 'format_list_bulleted', count: 4 },
        { id: 'archived', label: 'Archived', icon: 'inventory_2', count: 0 },
      ],
    },
    {
      id: 'status',
      title: 'Status',
      items: [
        { id: 'new', label: 'New', icon: 'radio_button_unchecked', count: 5 },
        { id: 'open', label: 'Open', icon: 'more_horiz', count: 2 },
        { id: 'solved', label: 'Solved', icon: 'check_circle', count: 1 },
      ],
    },
    {
      id: 'group',
      title: 'Group',
      items: [
        { id: 'marketing', label: 'Marketing', icon: 'ads_click', count: 3 },
        { id: 'sales', label: 'Sales', icon: 'speed', count: 1 },
        { id: 'design', label: 'Design', icon: 'auto_fix_high', count: 4 },
      ],
    },
  ];

  handleItemClick(event: MagneticMenuItemEvent): void {
    this.activeItemId = event.item.id;
    this.lastAction = `${event.item.label} selected`;
  }

  handleFooterMenuItemClick(event: MagneticMenuFooterActionEvent): void {
    if (event.item.id === 'theme') {
      this.toggleTheme();
      this.lastAction = `${this.theme === 'dark' ? 'Dark' : 'Light'} theme selected`;
      return;
    }

    this.lastAction = `${event.item.label} selected`;
  }

  setSide(side: 'left' | 'right'): void {
    this.side = side;
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }

  addExternalItem(): void {
    const id = `custom-${this.customItemIndex}`;
    this.magneticMenu?.addItem({
      id,
      label: `Custom ${this.customItemIndex}`,
      icon: 'bolt',
      count: this.customItemIndex,
    }, 'group');
    this.customItemIndex += 1;
  }

  toggleDesign(): void {
    this.hiddenDesign = !this.hiddenDesign;

    if (this.hiddenDesign) {
      this.magneticMenu?.hideItem('design');
    } else {
      this.magneticMenu?.showItem('design');
    }
  }

  resetItems(): void {
    this.hiddenDesign = false;
    this.customItemIndex = 1;
    this.magneticMenu?.setItems(this.menuItems);
  }
}

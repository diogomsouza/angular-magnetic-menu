# @stagyra/angular-magnetic-menu

Reusable Angular 18+ magnetic sidenav-style menu. The component ships as a complete container: it renders the menu panel from a typed item model, keeps a narrow closed strip with a draggable handle, and pushes the main content while opening and closing.

By default, `<stagyra-magnetic-menu>` fills the viewport (`100dvh`) and includes the same light/dark visual design used by the demo. No wrapper CSS is required for the menu, content plane, closed strip, or centered drag handle.

## Install

```bash
npm install @stagyra/angular-magnetic-menu
```

## Standalone Usage

```ts
import { Component, ViewChild } from '@angular/core';
import {
  MagneticMenuSection,
  StagyraMagneticMenuComponent,
} from '@stagyra/angular-magnetic-menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StagyraMagneticMenuComponent],
  template: `
    <stagyra-magnetic-menu
      #menu
      [items]="items"
      [(opened)]="opened"
      side="left"
      [dragEnabled]="true"
      [clickToToggle]="true"
      (itemClick)="select($event.item.id)"
    >
      <div magnetic-menu-header>Opportunities</div>

      <main>
        <button type="button" (click)="menu.addItem(extraItem, 'status')">
          Add item
        </button>
      </main>
    </stagyra-magnetic-menu>
  `,
})
export class AppComponent {
  @ViewChild(StagyraMagneticMenuComponent)
  menu?: StagyraMagneticMenuComponent;

  opened = true;

  items: MagneticMenuSection[] = [
    {
      id: 'views',
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
      ],
    },
  ];

  extraItem = { id: 'solved', label: 'Solved', icon: 'check_circle', count: 1 };

  select(itemId: string): void {
    console.log(itemId);
  }
}
```

## NgModule Usage

```ts
import { NgModule } from '@angular/core';
import { MagneticMenuModule } from '@stagyra/angular-magnetic-menu';

@NgModule({
  imports: [MagneticMenuModule],
})
export class AppModule {}
```

## Item Model

```ts
export interface MagneticMenuSection {
  id: string;
  title?: string;
  visible?: boolean;
  items: MagneticMenuItem[];
}

export interface MagneticMenuItem {
  id: string;
  label: string;
  icon?: string;
  iconClass?: string;
  count?: number | string;
  visible?: boolean;
  disabled?: boolean;
  tooltip?: string;
  routerLink?: string | readonly unknown[];
  exact?: boolean;
  action?: string;
  ariaLabel?: string;
}
```

The component does not render internal add buttons such as "+ Add Status" or "+ Add Group". Create, update, hide, show, and remove items through inputs or public component methods.

## Main Inputs

| Input | Default | Description |
| --- | --- | --- |
| `items` | `[]` | Sections or flat items used to render the menu body. |
| `opened` | `true` | Controlled open state. Supports `[(opened)]`. |
| `side` | `'left'` | `'left'` or `'right'`. |
| `theme` | `'light'` | `'light'`, `'dark'`, or `'auto'`. |
| `openedSize` | `348` | Open panel size in pixels. |
| `closedSize` | `6` | Closed strip size in pixels. |
| `handleSize` | `28` | Magnetic handle width in pixels. |
| `handleInset` | `5` | Moves the handle slightly into the content plane. |
| `contentPlaneOverlap` | `18` | Content plane overlap over the open panel, keeping the page visually above the menu. |
| `dragEnabled` | `true` | Enables pointer drag on the handle. |
| `clickToToggle` | `true` | Enables click/keyboard toggle on the handle. |
| `positionThreshold` | `0.48` | Drag progress needed to snap open when velocity is low. |
| `velocityThreshold` | `0.42` | Pointer velocity in px/ms that snaps open or closed. |
| `snapAnimationMs` | `440` | Final magnetic snap animation duration. |
| `activeItemId` | `undefined` | Manual active item. Overrides router-derived active state. |
| `closeOnItemClick` | `false` | Closes the panel after an item click. |

## Outputs

- `openedChange`
- `itemClick`
- `activeItemChange`
- `dragStart`
- `dragEnd`

## Public Methods

Use `@ViewChild(StagyraMagneticMenuComponent)` to call:

- `open()`
- `close()`
- `toggle()`
- `setItems(items)`
- `addItem(item, sectionId?)`
- `updateItem(itemId, patch)`
- `removeItem(itemId)`
- `hideItem(itemId)`
- `showItem(itemId)`
- `clearItems()`

## Slots

- `[magnetic-menu-header]` or `[stagyra-magnetic-menu-header]`
- `[magnetic-menu-footer]` or `[stagyra-magnetic-menu-footer]`
- default projected content becomes the main content area pushed by the menu

## Styling

The component includes sensible defaults and exposes CSS variables:

```scss
stagyra-magnetic-menu {
  --stagyra-magnetic-menu-height: 100dvh;
  --stagyra-magnetic-menu-panel-bg: #eef2f3;
  --stagyra-magnetic-menu-content-bg: #ffffff;
  --stagyra-magnetic-menu-content-radius: 18px;
  --stagyra-magnetic-menu-item-active-bg: #d9dddf;
  --stagyra-magnetic-menu-focus: #4e8cff;
}
```

Use the built-in dark theme directly:

```html
<stagyra-magnetic-menu theme="dark" [items]="items">
  ...
</stagyra-magnetic-menu>
```

`theme="auto"` follows `prefers-color-scheme`.

## Icons

The menu has two icon modes:

- `icon`: renders the value inside a `<span class="material-symbols-rounded">...</span>`.
- `iconClass`: renders an empty `<span>` with the provided CSS classes, for custom icon libraries.

### Material Symbols

The default project style uses Google Material Symbols Rounded. Add the font once in your application, usually in `src/styles.scss`:

```scss
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap");

.material-symbols-rounded {
  direction: ltr;
  display: inline-block;
  font-family: "Material Symbols Rounded";
  font-feature-settings: "liga";
  font-size: 22px;
  font-style: normal;
  font-weight: normal;
  letter-spacing: 0;
  line-height: 1;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
}
```

Then use Material icon names in the item object:

```ts
items = [
  { id: 'all', label: 'All', icon: 'format_list_bulleted', count: 4 },
  { id: 'archived', label: 'Archived', icon: 'inventory_2', count: 0 },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];
```

### Custom Icon Libraries

Use `iconClass` when your project already uses another icon system, such as Font Awesome, Bootstrap Icons, PrimeIcons, or a custom CSS sprite. The component will apply those classes to the inner icon element.

```ts
items = [
  { id: 'home', label: 'Home', iconClass: 'bi bi-house' },
  { id: 'reports', label: 'Reports', iconClass: 'pi pi-chart-line' },
  { id: 'users', label: 'Users', iconClass: 'fa-solid fa-users' },
];
```

Make sure the chosen icon library CSS is loaded by your application. If both `iconClass` and `icon` are provided, `iconClass` takes precedence.

## Publish

Build first:

```bash
npm run build:lib
```

Publish manually from the generated package:

```bash
cd dist/angular-magnetic-menu
npm publish --access public
```

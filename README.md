# Angular Magnetic Menu

Workspace for `@stagyra/angular-magnetic-menu`, an Angular 18+ reusable magnetic sidenav-style menu component.

Demo: https://diogomsouza.github.io/angular-magnetic-menu/

## Projects

- `projects/angular-magnetic-menu`: publishable library package.
- `projects/demo`: visual validation app.

## Commands

```bash
npm install
npm run build:lib
npm run build:demo
npm start
```

The package is prepared for manual npm publication, but this workspace does not run `npm publish` automatically.

## Package

Package name: `@stagyra/angular-magnetic-menu`

Initial version: `0.1.0`

License: MIT

Publish after building:

```bash
cd dist/angular-magnetic-menu
npm publish --access public
```

See [projects/angular-magnetic-menu/README.md](projects/angular-magnetic-menu/README.md) for API usage.

## Icon Setup

The npm package documentation is generated from [projects/angular-magnetic-menu/README.md](projects/angular-magnetic-menu/README.md). The component supports:

- `icon`: Material Symbols/Material Icons names, using the project's default `material-symbols-rounded` style.
- `iconClass`: custom icon CSS classes from libraries such as Bootstrap Icons, PrimeIcons, Font Awesome, or project-specific icons.

For the default Material Symbols style, load the font once in the consuming application:

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

Use `iconClass` when another icon system is preferred:

```ts
items = [
  { id: 'home', label: 'Home', iconClass: 'bi bi-house' },
  { id: 'reports', label: 'Reports', iconClass: 'pi pi-chart-line' },
];
```

# Angular Magnetic Menu

Workspace for `@stagyra/angular-magnetic-menu`, an Angular 18+ reusable magnetic sidenav-style menu component.

Demo: https://diogomsouza.github.io/angular-magnetic-menu/

## Projects

- `projects/angular-magnetic-menu`: publishable library package.
- `projects/demo`: visual validation app.
- `Video/Magnetic Menu.mp4`: reference video used for the interaction and visual direction.

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

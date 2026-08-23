# Memory — 3D Runtime / Dependency Corrective Checkpoint

- Base: Phase 12 localhost-fixed project.
- Fixed public `Invalid record id.` caused by legacy/malformed `MenuItem.categoryId` + Mongoose populate. Public menu/3D service now does a safe category join rather than populate on the legacy-sensitive field.
- Added `diagnose:demo-runtime` and non-destructive `repair:demo-runtime`.
- Repair ensures canonical demo menus for Ember House/Kori/Verde, repairs their category IDs, restores four Ember Phase 7 GLB configs and enables missing Photo Explode defaults where an image exists.
- Four real GLB files remain bundled under `frontend/public/models/`.
- Frontend dependency baseline: React/ReactDOM 19.2.8, React Router DOM 7.18.2, Three 0.185.1, R3F 9.7.0, Drei 10.7.8, Motion 13.1.0, Vite 8.2.1.
- Backend dependency baseline: Express 4.22.2, Mongoose 8.22.1, Multer 2.2.0, path-to-regexp override 0.1.13.
- Multer image upload sets `fieldNestingDepth: 1` and keeps existing file/field/part/size limits + magic-byte validation.
- Vite splits Three core, R3F and Drei vendors separately; true 3D remains lazy-loaded.
- New static commands: `test:runtime-repair`, `test:dependency-baseline`.
- Final installed-tree `npm audit` must be rerun locally after clean install; do not use `npm audit fix --force` without reviewing the advisory path.
- Phase 13 remains NEXT.

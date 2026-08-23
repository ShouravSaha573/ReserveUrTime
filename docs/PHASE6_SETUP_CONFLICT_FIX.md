# Phase 6 setup conflict fix

Date: 2026-08-18

## Symptom
`npm run setup:phase6` connected to MongoDB but failed with:

`Updating the path 'isActive' would create a conflict at 'isActive'`

## Cause
The setup helper used a MongoDB upsert containing both `$setOnInsert` and `$set`, while Mongoose `setDefaultsOnInsert` could also place defaulted fields such as `isActive`/`isAvailable` into the insert side. MongoDB rejects an update when the same path is targeted by conflicting update operators.

## Fix
`backend/src/seed/setupPhase6Prototype.js` now uses a deterministic find/create-or-save flow:
- find or create the `Starters` category;
- find or create `Coal-Roasted Pumpkin`;
- for an existing dish, set only the Phase 6 eligibility fields on the Mongoose document and call `save()`;
- preserve the existing dish's ordinary content while forcing `isActive=true`, `isAvailable=true`, and the Phase 6 `threeD` configuration.

No database reset is required.

## Recovery commands
From `backend/`:

```powershell
npm run setup:phase6
npm run diagnose:phase6
npm run dev
```

After setup, diagnosis should show:
- `threeD.enabled: true`
- `threeD.modelUrl: /models/coal-roasted-pumpkin.glb`
- `Public 3D endpoint eligible: true`

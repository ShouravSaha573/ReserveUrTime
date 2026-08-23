# MVC_ARCHITECTURE.md — Separate Frontend and Backend

ReserveUrTime is now two independently runnable applications inside one project folder.

```text
ReserveUrTime/
├── frontend/                 React/Vite View application
│   ├── src/
│   ├── package.json
│   └── .env
│
├── backend/                  Node/Express MVC API application
│   ├── src/
│   │   ├── models/           Mongoose Models
│   │   ├── controllers/      Request/response Controllers
│   │   ├── routes/           Route mapping
│   │   ├── services/         Domain/business logic
│   │   ├── middleware/       Auth/security/error middleware
│   │   ├── config/           DB/default config
│   │   ├── seed/             Development seed
│   │   └── tests/            Backend smoke tests
│   ├── package.json
│   └── .env
│
└── docs/
```

## MVC mapping

- Model: `backend/src/models/*`
- Controller: `backend/src/controllers/*`
- View: React files under `frontend/src/*`
- Routes: `backend/src/routes/*` connect HTTP endpoints to Controllers.
- Services: business logic that should not live inside a View or route declaration.

## Independent startup rule

There is intentionally no root workspace/concurrently startup requirement now.

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Backend: `http://localhost:5000`
Frontend: `http://localhost:5173`

This makes the frontend and backend independently installable, testable, startable and deployable.


## Phase 7 MVC additions
Restaurant Admin 3D writes: React editor → protected Restaurant Admin route → `restaurant3DController` → `threeDAnimationService` → `MenuItem`. Public full 3D reads: React 3D menu → Restaurant route → `publicRestaurantExperienceController` → `publicRestaurantExperienceService` → `MenuItem`. Frontend and backend still start independently.

## Pre-Phase 10 security boundary
MVC separation remains unchanged: the React View cannot access MongoDB or payment gateway secrets. Security-sensitive logic belongs in backend middleware/services/controllers. Phase 10 now has a backend PaymentAttempt model + payment service/controller/route layer. SSLCOMMERZ initiation/validation remains backend-only and must never move into frontend code.


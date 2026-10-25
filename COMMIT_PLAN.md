# Suggested Red → Green → Refactor commit plan

The brief asks for a visible TDD rhythm in your Git history. The code in this repo is complete; to produce a **truthful** history, rebuild it one behaviour at a time:

1. Temporarily move the implementation file(s) for the step out of `src/` (or `git stash` them).
2. Commit the **test** → run it → watch it **fail** (RED). Keep the failing output.
3. Restore the implementation → run → **pass** (GREEN) → commit.
4. Tidy names/duplication → run → commit (REFACTOR).

Only commit what you actually ran, and be ready to explain every step in the interview.

Add this trailer to every commit where AI helped (blank line before it):

```
feat: add AuthService

Generated the first draft with an AI assistant, then reviewed and adjusted validation.

Co-authored-by: Claude <noreply@anthropic.com>
```

## Backend sequence

| # | RED (tests) | GREEN (implementation) |
|---|---|---|
| 0 | – | `chore: scaffold backend` – package.json, tsconfig, jest config, `.gitignore` |
| 1 | `tests/unit/schemas.test.ts` | `src/errors.ts`, `src/validation/schemas.ts` |
| 2 | `tests/unit/tokenService.test.ts` | `src/services/tokenService.ts` |
| 3 | `tests/helpers/fakes.ts`, `tests/unit/authService.test.ts` | `src/types.ts`, `src/repositories/interfaces.ts`, `src/services/passwordHasher.ts`, `src/services/authService.ts` |
| 4 | `tests/unit/vehicleService.test.ts`, `inventoryService.test.ts` | `src/services/vehicleService.ts`, `inventoryService.ts` |
| 5 | `tests/unit/vehicleRepository.test.ts` (+ `tests/helpers/testApp.ts`) | `src/db/database.ts`, `src/repositories/*Repository.ts` |
| 6 | `tests/integration/auth.routes.test.ts` | `src/middleware/*`, `controllers/authController.ts`, `routes/authRoutes.ts`, `config.ts`, `app.ts` |
| 7 | `tests/integration/vehicles.routes.test.ts` | `controllers/vehicleController.ts`, `routes/vehicleRoutes.ts` |
| 8 | `tests/integration/inventory.routes.test.ts` | `controllers/inventoryController.ts` (+ route wiring) |
| 9 | – | `refactor:` anything you improve · `feat: seed script` · `feat: server entry point` |

## Frontend sequence
1. `chore: scaffold Vite + React + Tailwind`
2. RED `utils/format.test.ts` → GREEN `utils/format.ts`
3. `feat: typed API client + auth context`
4. RED `pages/AuthPage.test.tsx` → GREEN `pages/AuthPage.tsx`
5. RED `components/VehicleCard.test.tsx` → GREEN `components/VehicleCard.tsx`
6. RED `components/VehicleFormModal.test.tsx` → GREEN `VehicleFormModal.tsx`
7. `feat: dashboard (search, sort, purchase, admin modals)`
8. `docs: README, screenshots, test report`

## Before you submit – checklist
- [ ] `npm test` passes in `backend/` and `frontend/`; paste output into README → *Test report*
- [ ] Screenshots saved in `docs/screenshots/` (login, dashboard, search, admin)
- [ ] README → *My AI Usage* rewritten in your own words
- [ ] `PROMPTS.md` contains the raw chat log / share links (no summaries)
- [ ] Repository is public; `.env` is **not** committed

# Architecture decisions

## 2026-10-13 — FSD migration and app architecture reset

- Layer map: `app/` owns composition and state orchestration; `widgets/` owns shell UI and composed subviews; `features/` owns user-facing behaviors and hooks; `entities/` owns models and contracts; `shared/` owns transport, config, utilities, and generic UI.
- Import rules: no feature-to-feature imports; no widget-to-widget imports; no `src/components` entrypoints; no `../shared` or `./components` legacy paths; all boundaries go through local slice indexes or shared/public APIs only.
- Test organization: mirrored tree under `tests/` matching the app structure (`features/...`, `widgets/...`, `app/...`, `entities/...`, `shared/...`) so tests remain colocated with the modules they validate and breakage is easier to trace.
- CSS strategy: CSS Modules remain the styling primitive for component-scoped UI, while design tokens live in `src/styles/tokens.css` and are applied via `data-theme` on the root element; theme switches are declarative and token-based rather than per-component overrides.
- Event typing: `FormEvent` was replaced with `SubmitEvent` in form handlers to narrow the event contract and keep DOM typing aligned with actual submit semantics.
- Request abstraction: the API request flow should be normalized through a generic `request<T>()` helper to centralize fetch, error translation, and GREEN-API response handling instead of duplicating logic across checks, sends, and polling.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-23

### Added — Security Hardening (Sprint 1–2)

- **SEC-01/02**: Strong secret enforcement in non-test environments; Redis-backed
  distributed rate limiting with in-memory fallback.
- **SEC-03**: ASGI `MaxBodySizeMiddleware` (1 MiB limit) with nginx proxy buffering
  alignment; 413 responses pass through logging and security headers.
- **SEC-04**: Refresh token HttpOnly cookie — `HttpOnly; Secure; SameSite=Strict`
  in production, cookie takes priority over request body, backward-compatible body
  fallback. Frontend `fetch` uses `credentials: 'include'`.
- **SEC-05**: Resource field-level validation — ID regex (path-traversal safe),
  discipline slug whitelist, tag length/character validation (XSS safe), author
  non-empty/length, URL http/https scheme enforcement (blocks `javascript:`,
  `ftp:`).
- **SEC-06**: Global exception handlers — structured 422 for validation errors,
  consistent `{"detail": ...}` for HTTPException, generic 500 with request-id
  correlation for unhandled exceptions. Stack traces never sent to client.
- **SEC-07**: Log sanitization — sensitive query parameters (token, password,
  secret, etc.) redacted to `***REDACTED***` in access logs.

### Added — Stability (Sprint 3)

- **STAB-01**: Configurable DB connection pool — `pool_size`, `max_overflow`,
  `pool_recycle` (1800s), `pool_pre_ping` (True), `pool_timeout`. SQLite
  auto-detected and exempt from pool kwargs.
- **STAB-02**: FastAPI lifespan — startup DB connectivity check with retry
  (5 attempts, 2s delay); graceful `engine.dispose()` on shutdown. `/health`
  liveness probe (static 200) and `/health/ready` readiness probe (SELECT 1,
  returns 503 on failure).
- **STAB-03**: PostgreSQL integration tests (auto-skipped when PG unavailable).

### Added — Production Readiness (Sprint 4)

- **PROD-01**: `make backup`, `make restore FILE=...`, `make cleanup-db DAYS=N`
  Makefile targets wrapping the existing pg_dump/restore scripts.
- **PROD-02**: CI security scanning workflow — Bandit SAST, pip-audit dependency
  vulnerability scan, npm audit (high+ critical). Extended Dependabot to cover
  pip, docker, and github-actions ecosystems.
- **PROD-03**: Top-level React `ErrorBoundary` wrapping the entire app (outside
  Router, inside LangProvider) as a safety net for provider/hook errors.
- **PROD-04**: `X-API-Version: 1.2.0` response header on all responses; version
  bumped to 1.2.0 in FastAPI app, root endpoint, and pyproject.toml.

### Changed

- `medicine` and `law` added to the canonical discipline catalog (previously
  present in seed data but missing from the API catalog, causing serialization
  failures).
- `backend/pyproject.toml` dev dependencies now include `bandit[toml]` and
  `pip-audit`.

## [1.1.0] - 2026-06-11

### Added

- **Bilingual UI** with English (default) and Chinese. A `Languages` icon
  in the header toggles language; the choice is also a first-class option
  in Settings and persists across sessions. `<html lang>` is kept in sync
  for accessibility tools.
- **Lightweight i18n layer** — `src/i18n/dict.ts` (typed dictionary)
  + `src/i18n/LangProvider.tsx` (`useT()` hook) — zero external
  dependencies. The same `t(key, vars?)` / `opt(key)` API is used in all
  pages and components.
- **Discipline bilingual fields** — every discipline in
  `src/data/disciplines.ts` now carries a `name` (CN) + `nameEn` (EN) and
  a `blurb` + `blurbEn`, swapped at runtime by the active language.

### Changed

- The summary line on `ResourceCard` is now built from a translated
  template (`{type} · {year} · {tags} tags` / `{type} · {year} · {tags} 个主题`).
- `ResourceCard` no longer always shows the summary — it is only rendered
  when `showSummary` is set, which matches the home page's "featured"
  row usage.

### Removed

- `src/data/filterOptions.ts` — types chips are now built inline in
  `ResourcesPage` with translated labels.
- `formatAuthorsFull`, `resourceSummary`, and `TYPE_LABELS_EN` from
  `src/utils/format.ts` — they were unused or replaced by i18n-aware
  equivalents.

## [1.0.1] - 2026-06-11

### Changed (visual & UX audit)

- Featured resources on the home page are now a horizontal scroll row
  (previously a 2-column grid that left a half-empty row), matching the
  "printed journal" feel.
- The hero search input border is now 1px (was 2px) for consistency with
  the rest of the site's 1px-hairline system.
- The home-page publication kicker and the bottom three-column intro use
  12px / 16px type respectively.
- The detail page action row is now exactly four equal buttons:
  `Download` / `View DOI` / `Copy Cite` / `Save`. The redundant `Source`
  button is gone; when `doi` is absent we fall back to `View Source` so
  the row stays symmetrical, and a small "Also: hostname" link is shown
  when both DOI and external URL exist.
- The redundant `border-t hairline` divider was removed from the detail
  page's abstract region.
- The settings page's "selected" indicator is now a 28×1.5px moss-green
  underline (previously a 4×20px vertical bar), per the 1.5px-underline
  spec.
- The favourite toggle on resource cards is now 32×32px to give a larger
  hit area; the matching remove button on the Favorites page was
  enlarged too.
- The footer copyright line was bumped from 10px to 12px for legibility.
- Discipline card numbering and spacing were tuned, with sizes that adapt
  to the breakpoint.
- The hero search box now shows a `/` kbd hint instead of "Enter".
- Discipline cards and the detail page's abstract/preview buttons expose
  `aria-expanded` / `aria-pressed` for screen readers.

## [1.0.0] - 2026-06-11

### Added

- 8 pages: Home, Resources list, Resource detail, Discipline, Search,
  Favorites, Settings, About.
- 8 seeded resources covering 6 disciplines and 4 resource types.
- 2-line abstract preview, tags, and download / jump actions on every
  resource card.
- Detail page with collapsible full abstract, four citation formats
  (APA / MLA / GB/T 7714 / BibTeX) with one-click copy, and related
  resources.
- Theme (light / dark / auto), motion (full / reduced / off), and font
  size (standard / large) preference groups, persisted in LocalStorage.
- Favorites page with JSON export and clear-all.
- GitHub Actions: CI (lint + build) and Deploy to GitHub Pages.

# esgratings-web

Next.js 16 (App Router) rebuild of esgratings.co.in — public site, both public
calculators (ESG and BFSI), and the superadmin dashboard.

## Stack

Next.js 16.3, React 19, TypeScript (strict), Tailwind CSS v4, npm,
lucide-react, chart.js 4 + react-chartjs-2, html2pdf.js 0.10.1, next/font
(Inter from Google, Clash Display local).

## Architecture

- **Routes:** `(site)` route group for the public pages, `admin` for the
  dashboard.
- **Content:** static, typed data in `content/`.
- **API calls:** everything goes through `/api/*`, which `next.config.ts`
  rewrites to the FastAPI backend (`esgratings-api`), so the session cookie
  stays same-origin. There is no `middleware.ts` — it would cap upload
  bodies.
- **Reports:** client components that generate PDFs in the browser with
  html2pdf.js.

## Getting started

```bash
cp .env.example .env.local   # set API_URL if the API isn't on :8000
npm install
npm run dev
```

Or use the dev scripts, which install dependencies if needed, start Next.js
in the background, and wait for it to become healthy:

```bash
./dev_start.sh   # → http://localhost:3000
./dev_stop.sh
```

Logs are written to `.dev/web.log`; the pid is in `.dev/web.pid`.

## Environment

| Variable | Purpose |
| --- | --- |
| `API_URL` | Server-side base URL of the FastAPI backend, used by `next.config.ts` rewrites and by server components. |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (default `https://esgratings.co.in`). It is the `metadataBase` that turns each page's relative canonical and Open Graph URLs into absolute ones, and the base of `sitemap.xml` and `robots.txt`. |

Both are read at **build time**: the `/api` rewrite and `NEXT_PUBLIC_*` values
are baked into `.next`, so set them before `npm run build` (in Docker, pass
them with `--build-arg`). No other secrets live in this repo.

## Design tokens

Brand and calculator colours, fonts and motion utilities are defined in
`app/globals.css` as a Tailwind v4 `@theme` block (`--color-navy`,
`--color-brand`, `--color-calc-navy`, `--color-calc-blue`, `--color-ink`,
`--color-muted`, `--color-line`, `--color-field`, `--color-bg-soft`,
`--font-sans`, `--font-display`, …), plus the `fadeUp` / `sheen` / `drift`
keyframes and the `.reveal` / `.cta-sweep` / `.card-lift` utility classes.
All motion respects `prefers-reduced-motion`.

## Docker

```bash
docker build \
  --build-arg API_URL=http://api:8000 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://esgratings.co.in \
  -t esgratings-web .
docker run -p 3000:3000 esgratings-web
```

The image is a multi-stage `node:22-alpine` build using Next's
`output: "standalone"`. Without the build args the rewrite points at
`http://localhost:8000`, i.e. inside the container, and every `/api` call
fails. The same values are also set as runtime `ENV`s for server components;
`docker run -e API_URL=…` overrides only that runtime copy, not the baked-in
rewrite.

### Production routing

The Next.js `/api/*` rewrite is a dev convenience. In production, nginx or
Cloudflare in front of the site should route `/api/*` straight to the FastAPI
service (keeping it same-origin, so the session cookie still works) and set
`X-Forwarded-For` to the client IP, so the API's rate limits and audit logs see
the real visitor rather than the Next.js server. Everything else goes to this
container.

## Scripts

- `npm run dev` — start the dev server.
- `npm run build` — production build.
- `npm run start` — run the production build.
- `npm run lint` — ESLint.

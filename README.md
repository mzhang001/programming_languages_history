# Language Atlas

[Explore the website](https://mzhang001.github.io/programming_languages_history/) ·
[Contribute on GitHub](https://github.com/mzhang001/programming_languages_history) ·
[Build and browser tests](https://github.com/mzhang001/programming_languages_history/actions/workflows/ci.yml)

An open-source, interactive history of programming ideas. Explore languages along
a year axis, follow documented influences, and compare what each language adopted
and changed.

## Develop

Use Node.js 22.12+ and pnpm 11.7.0.

```sh
pnpm install
pnpm dev
```

The development command validates and builds the historical data before starting
Vite. After changing YAML, restart the command (or run `pnpm build:data`) to refresh
the generated files. Visit the URL printed by Vite.

## Verify

```sh
pnpm check                         # data, types, lint, unit/component tests, build
pnpm exec playwright install chromium
pnpm test:e2e                      # real Chromium, desktop and mobile layouts
```

Playwright starts a production preview automatically and retains traces and
screenshots on failure. `pnpm exec playwright show-report` opens its report.
Browser tests require permission to start a localhost server and launch Chromium.
Use `pnpm test:watch` while working on logic or components.

## Publish

1. Push this repository to your GitHub account.
2. In **Settings → Pages**, choose **GitHub Actions** as the build source.
3. Set the repository Actions variable `ENABLE_PAGES` to `true`.
4. Push to `main` or run the **Checks** workflow manually. Deployment runs only
   after validation and all tests pass.

The workflow configures the Pages base path and GitHub contribution links. For
other static hosts, upload `dist/` after `pnpm build`; configure `BASE_PATH` and
`VITE_REPOSITORY_URL` as shown in `.env.example`. No credentials belong in these
public build variables. Search and selections use query parameters, so the host
does not require a client-side route fallback.

## Historical data

The initial catalog contains **30 languages, 102 milestones, and 27 influence
relationships**, with primary sources and supplementary Wikipedia references.
All explanations are original; citations link to the evidence. Milestone dates
refer to the named release or publication, not necessarily the first private
implementation. Coverage is deliberately incomplete.

Language files are in `data/languages/`; source metadata is in `data/sources.yaml`.
`pnpm build:data` generates ignored JSON under `public/data/`: a compact index and
one lazily loaded detail bundle per language. Never hand-edit generated JSON.

The timeline renders only visible rows and at most 80 relevant arrows at a time.
The equivalent list paginates languages and connections. A synthetic unit test
exercises 1,000 languages and 10,000 connections.

The scheduled **Citation links** workflow publishes a report for manual review.
HTTP failures can reflect rate limits or bot protection; they do not automatically
invalidate a source or remove historical claims.

## Project direction

The atlas starts with 30 languages and grows through reviewed pull requests.
Historical content is curated, sourced, and explicitly incomplete. A track is
historical context, not a claim that a language is still actively maintained.

- [Architecture and engineering roadmap](docs/architecture.md)
- [Contributing](CONTRIBUTING.md)
- [Historical editorial guide](docs/editorial.md)
- [Verification record and publication status](docs/verification.md)

Code is MIT licensed. Original historical prose and curated data are
[CC BY 4.0](LICENSE-CONTENT.md).

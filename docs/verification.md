# Verification record

The initial release was checked locally on macOS with Chromium and subsequently
on GitHub's Linux runner. The detailed checks below describe local verification;
the public CI record is linked under Publication.

- `pnpm check`: data validation, TypeScript, ESLint, 28 unit/component tests,
  and production build passed.
- `pnpm test:e2e`: 19 passed; one mobile-only scenario intentionally skipped
  in the desktop project. Both projects use Chromium; mobile is device emulation,
  not a physical iPhone or WebKit test.
- Browser coverage includes search aliases, empty results, time selection and
  zoom, influence comparison, citations, offscreen sources, code examples, URL
  reload/history, keyboard focus, the accessible list, invalid ranges, request
  retry, mobile focus trapping, and viewport overflow.
- The synthetic browser fixture checks 1,000 languages and 10,000 connections,
  bounding rendered rows/arrows and checking list pagination. This checks DOM
  bounds, not a universal performance guarantee.
- Desktop and mobile screenshots were inspected for the initial atlas and
  language detail views.
- A separate production build under `/programming_languages_history/` loaded
  its assets and lazy Rust detail bundle in Chromium. Configured contribution
  and source-data links were also checked with a placeholder repository URL.

The browser run initially found an ambiguous test locator matching both an arrow
and a comparison button. Scoping it to the comparison panel resolved the failure;
the full suite then passed without retries.

## Publication

The public repository is
[mzhang001/programming_languages_history](https://github.com/mzhang001/programming_languages_history).
The [Checks workflow](https://github.com/mzhang001/programming_languages_history/actions/workflows/ci.yml)
runs validation and browser tests on Linux before deploying to
[GitHub Pages](https://mzhang001.github.io/programming_languages_history/).
See the workflow history for results associated with each commit.

The architecture and implementation sequence are in [the roadmap](architecture.md).

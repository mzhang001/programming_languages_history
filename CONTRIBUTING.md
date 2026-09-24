# Contributing

Contributions to code, accessibility, historical coverage, and corrections are
welcome. Open a focused pull request with a clear description of the problem,
the resulting behavior, and how you verified it. Include screenshots for visual
changes and source links for historical changes.

## Atomic commits

One commit should contain one coherent change, its relevant tests, and its
documentation. Each commit should build and pass applicable checks. Keep unrelated
formatting and refactoring separate. Use imperative, human-readable messages:

- `Preserve offscreen sources when filtering the timeline`
- `Document Haskell's influence on Python comprehensions`

Avoid `updates`, `fix stuff`, and committed WIP states. Review `git diff --cached`
before committing. Maintainers review historical accuracy; automation can check
structure, not truth.

By contributing, you agree to license your contribution under the applicable
[code](LICENSE) or [content](LICENSE-CONTENT.md) license. Submit only material
you have the right to contribute; write your own explanation and cite originals.

See [the editorial guide](docs/editorial.md) for historical standards and
[the architecture](docs/architecture.md) for engineering boundaries.

## Add a language without changing UI code

1. Copy `data/languages/haskell.yaml` to a new file named after a stable lowercase
   ID (for example `example-language.yaml`).
2. Change the language ID, name, aliases, summary, paradigms, and introduction ID.
   Replace the milestones with at least three well-supported events. Use unique,
   prefixed IDs and set each milestone's `language` to the new language ID.
3. Add supporting sources to `data/sources.yaml`. Each source needs `id`, `title`,
   `author`, `url`, and a specific `section`. Cite these source IDs in milestones
   and influence records. Do not copy source prose.
4. Add incoming influences to the destination language's file. `source` is a
   language ID; `destination` is a milestone ID in that same destination file.
   Use `sourceMilestone` only when you have evidence for a particular source event.
   An empty `influences: []` is valid and preferable to unsupported claims.
5. Run `pnpm check`, restart `pnpm dev`, and find the new language through search.
   Inspect its timeline, explanations, and source links. Run `pnpm test:e2e` for
   any change that affects interactions.

Dates accept `{ year: 1960 }`, `{ year: 1960, approximate: true }`, or
`{ year: 1958, endYear: 1960 }`. Uncertain dates produce editorial warnings rather
than invented precision. Disputed influences require `evidence: disputed` and a
`caveat` explaining the disagreement.

The unit catalog test protects the initial language set while allowing additions.
New languages require no changes to UI code or test expectations. Keep documentation
accurate when describing expanded coverage; do not weaken reference validation.

## Tests and review

Run `pnpm check` before submitting. Unit tests cover domain logic, component tests
cover user-visible behavior, and Playwright checks the built site on desktop and
mobile viewports. Avoid tests that merely repeat implementation constants.
Do not refresh expected results just to make a failing behavior pass.

Maintainers should configure a branch rule requiring the `check` job and review
before merging. Changes to citations and dates need human historical review even
when CI is green. See the PR template for the evidence to include.

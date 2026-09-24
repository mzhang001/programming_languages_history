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

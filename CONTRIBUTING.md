# Contributing

Thanks for considering a contribution to `react-protected`.

Small, focused changes are preferred. Public API changes should be discussed before implementation.

## Before You Start

- Check existing issues and discussions before starting a new change.
- Open an issue first for API changes, behavior changes or larger features.
- Keep proposals concrete: use case, current pain point and expected API.

## Local Setup

```bash
nvm use
pnpm install
pnpm build
```

## Development Workflow

1. Create a branch for your change.
2. Make the smallest change that solves one problem.
3. Add or update tests when behavior changes.
4. Run the project checks before opening a PR.

## Quality Checks

Run all checks locally:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Changesets

If your change affects a package that will be published to npm, add a changeset:

```bash
pnpm changeset
```

Commit the generated file from `.changeset/` with your PR.

## Pull Requests

- Keep PRs focused and easy to review.
- Describe the problem, approach and trade-offs.
- Link the related issue when one exists.
- Include docs updates when public API or usage changes.

## Scope Guidance

Good contributions:

- bug fixes
- test coverage improvements
- docs improvements
- examples
- focused API improvements discussed in advance

Please avoid large unsolicited rewrites or breaking API changes without prior discussion.

# Contributing

## Development workflow

1. Create a focused branch from `main`.
2. Keep each pull request limited to one coherent change.
3. Never commit `.env` files, credentials, cookie jars, access tokens, or production data.
4. Update tests and documentation when behaviour changes.
5. Run the relevant quality checks before opening a pull request.

## Backend checks

```bash
cd backend
npm ci
npm test
npm audit --omit=dev --audit-level=high
```

## Frontend checks

```bash
cd frontend
npm ci
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## Review expectations

Reviewers should pay particular attention to:
- authentication and role-based authorization
- validation of user-controlled input
- upload and media handling
- course publication and enrollment state transitions
- error handling and information disclosure
- backwards compatibility of API contracts
- dependency and deployment risk

## Commit and PR quality

Use concise, descriptive commit messages. Pull requests should explain what changed, why it changed, how it was verified, and any migration or deployment implications.

# Security Policy

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities in a public issue. Report them privately to the repository owner with enough detail to reproduce and assess the issue.

Include, when possible:
- affected route, component, or dependency
- reproduction steps
- expected versus observed behaviour
- security impact
- suggested remediation

## Security-sensitive areas

Changes involving the following areas require additional review:
- authentication, JWT issuance, cookies, and session handling
- authorization and role checks for students, collaborators, and administrators
- course publishing and administrative workflows
- file uploads and Cloudinary integration
- email delivery and password/account recovery flows
- MongoDB queries and user-controlled filters
- secrets, environment variables, and deployment configuration
- dependency upgrades affecting Express, Mongoose, React, or authentication packages

## Repository hygiene

Never commit passwords, API keys, access tokens, cookie jars, session exports, production database strings, or real user data. Use environment variables and sanitized examples instead.

## Supported version

Security fixes are applied to the current default branch unless a maintained release branch is explicitly documented.

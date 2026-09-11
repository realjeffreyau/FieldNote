# Contributing

FieldNote is a personal portfolio and demonstration repository. Contributions
should improve the local synthetic-test workflow or its documentation. Do not
submit production integrations or real-world patient data.

## Before opening an issue or pull request

- Use fictional or properly de-identified data only.
- Do not include PHI, credentials, API keys, or private logs.
- Reproduce problems against a clean checkout when possible.
- Include the operating system, Node.js version, command, expected result, and
  observed result.

## Local checks

```bash
npm ci
npm run release:private
npm audit --omit=dev --audit-level=moderate
git diff --check
```

The release check intentionally leaves the agency readiness register blocked.
That is an expected prototype boundary, not a failing production deployment.

## Pull requests

Keep changes focused. Explain user-visible or security-relevant behavior. Do
not describe the project as HIPAA-ready, NEMSIS-ready, production-ready, or an
ePCR unless those claims are independently verified and the repository scope
has changed.

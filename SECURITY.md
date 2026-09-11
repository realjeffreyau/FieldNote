# Security

FieldNote is a public demonstration of a private synthetic-test build. It is
not approved for real patient information or operational use.

## Do not disclose sensitive data

Do not put protected health information, credentials, API keys, private URLs,
or sensitive logs or screenshots in issues, pull requests, or example files.
Use fictional or properly de-identified examples only.

## Reporting a vulnerability

Please do not report suspected vulnerabilities in a public issue. Use GitHub's
private vulnerability reporting option from the repository's Security tab when
available. If that option is unavailable, contact the maintainer through the
GitHub profile before sharing details.

Include:

- affected file or endpoint
- minimal reproduction using synthetic data
- expected and observed behavior
- relevant version or commit

Do not test against or attempt to access systems outside your own local
checkout. This project has no hosted service, public API, or production
deployment.

## Scope

The public code includes a local Node.js server, browser client, optional
loopback Ollama route, and development/test scripts. Passing automated checks
does not establish HIPAA, NEMSIS, clinical, agency, accessibility, or
production readiness.

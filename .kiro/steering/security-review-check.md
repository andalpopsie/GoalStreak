---
inclusion: manual
description: "Reviews changed files after agent execution for potential security issues including API keys, tokens, credentials, private keys, encryption keys, authentication tokens, passwords, hardcoded URLs, database connection strings, and IP addresses containing sensitive data. Highlights risks and suggests secure alternatives."
---

Review all files changed in this session for potential security issues. Use `git diff` to identify changed files, then scan each one for:

1. **API keys, tokens, or credentials** hardcoded in source code
2. **Private keys or sensitive certificates** embedded in files
3. **Encryption keys or certificates** stored in plaintext
4. **Authentication tokens or session IDs** committed to code
5. **Passwords or secrets** in configuration files or source code
6. **IP addresses** that may expose sensitive infrastructure
7. **Hardcoded internal URLs** that should be environment variables
8. **Database connection credentials** (connection strings, usernames, passwords)

For each issue found:
1. **Highlight the specific security risk** — explain what could go wrong if this is exposed
2. **Suggest a secure alternative** — e.g., use environment variables, secret managers, or .env files excluded from version control
3. **Recommend security best practices** — such as rotating exposed credentials, using .gitignore, or leveraging platform-specific secret storage

If no security issues are found, confirm the changes look clean from a security perspective.

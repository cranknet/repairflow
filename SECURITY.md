# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

1. **Email**: Send details to [security@repairflow.app] (if available)
2. **GitHub Security Advisory**: Use the "Report a vulnerability" button on the Security tab of this repository
3. **Private Issue**: Create a private security issue (if enabled)

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity, typically within 30 days for critical issues

### Disclosure Policy

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide a detailed response within 7 days
- We will keep you informed of the progress toward a fix
- We will notify you when the vulnerability has been fixed
- We will credit you in the security advisory (if you wish)

## Security Best Practices

When using RepairFlow:

1. **Change Default Passwords**: Always change default admin/staff passwords
2. **Use Strong Secrets**: Generate strong `NEXTAUTH_SECRET` values
3. **Keep Dependencies Updated**: Regularly run `npm audit` and update dependencies
4. **Use HTTPS**: Always use HTTPS in production
5. **Database Security**: Secure your database connection strings
6. **Environment Variables**: Never commit `.env` files to version control
7. **Regular Backups**: Maintain regular database backups
8. **Access Control**: Limit admin access to trusted users only

## Known Security Considerations

- SMS functionality requires COM port access (desktop only)
- Authentication uses NextAuth.js with credentials provider
- Database uses Prisma ORM with parameterized queries to prevent SQL injection
- Input validation uses Zod schemas

## Security Updates

Security updates will be released as patches. Please keep your installation updated.


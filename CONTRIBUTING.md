# Contributing to RepairFlow

Thank you for your interest in contributing to RepairFlow! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/cranknet/repairflow/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Possible implementation approach (optional)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the code style
   - Add comments for complex logic
   - Update documentation if needed
4. **Test your changes**
   - Test manually
   - Ensure no TypeScript errors
   - Check for linting issues
5. **Commit your changes**
   ```bash
   git commit -m "Add: description of your feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Add screenshots for UI changes

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see README.md)
4. Set up database: `npx prisma db push`
5. Start dev server: `npm run dev`


## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions focused and small
- Use Prettier for formatting (if configured)

## Project Structure

- `src/app/` - Next.js pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions and helpers
- `src/contexts/` - React contexts
- `prisma/` - Database schema


## Commit Message Guidelines

Use clear, descriptive commit messages:

- `Add: Feature description`
- `Fix: Bug description`
- `Update: What was updated`
- `Refactor: What was refactored`
- `Docs: Documentation changes`

## Version Management

When making significant changes, update the version:

1. **Patch version** (1.0.0 → 1.0.1): Bug fixes
   ```bash
   npm run version:patch
   ```

2. **Minor version** (1.0.0 → 1.1.0): New features (backward compatible)
   ```bash
   npm run version:minor
   ```

3. **Major version** (1.0.0 → 2.0.0): Breaking changes
   ```bash
   npm run version:major
   ```

4. **Set specific version**:
   ```bash
   npm run version:set 1.2.3
   ```

The script will automatically:
- Update `package.json` version
- Update `src/lib/version.ts`
- Add a new entry to `CHANGELOG.md`

**Important**: After running the version script, review and update the CHANGELOG.md with actual changes before committing.

## Testing

Before submitting:
- Test your changes manually
- Check for TypeScript errors: `npm run build`
- Verify linting: `npm run lint`
- Test on different screen sizes (responsive)


## Questions?

Feel free to open an issue for questions or reach out to maintainers.

Thank you for contributing to RepairFlow! 🎉


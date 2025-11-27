# Versioning Guide

RepairFlow follows [Semantic Versioning](https://semver.org/) (SemVer) for version management.

## Version Format

Versions follow the format: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes that are not backward compatible
- **MINOR** (1.0.0 → 1.1.0): New features that are backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes that are backward compatible

## Updating Versions

### Using NPM Scripts

```bash
# Patch version (bug fixes)
npm run version:patch

# Minor version (new features)
npm run version:minor

# Major version (breaking changes)
npm run version:major

# Set specific version
npm run version:set 1.2.3
```

### What Gets Updated

The version script automatically updates:
1. `package.json` - version field
2. `src/lib/version.ts` - APP_VERSION constant
3. `CHANGELOG.md` - Adds new version entry with date

### After Running Version Script

1. **Review CHANGELOG.md** - Fill in the actual changes:
   - Added: New features
   - Changed: Changes to existing features
   - Fixed: Bug fixes
   - Removed: Deprecated features

2. **Commit the changes**:
   ```bash
   git add -A
   git commit -m "chore: bump version to X.Y.Z"
   ```

3. **Create a Git tag**:
   ```bash
   git tag vX.Y.Z
   ```

4. **Push to repository**:
   ```bash
   git push
   git push --tags
   ```

## Version Display

The app version is displayed in:
- Sidebar footer (when not collapsed)
- Settings page (General Settings tab)

Version information is available via:
- `src/lib/version.ts` - Version constants and utilities
- `getVersionInfo()` - Get complete version information

## Release Process

1. **Update version** using npm scripts
2. **Update CHANGELOG.md** with actual changes
3. **Test thoroughly** before release
4. **Commit and tag** the version
5. **Push to GitHub**
6. **Create GitHub Release** (optional, can be automated via workflow)

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## Current Version

**1.0.0** - Stable Release

---

For questions about versioning, open an issue or discussion on GitHub.


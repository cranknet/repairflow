#!/usr/bin/env node

/**
 * Version Update Script
 * Updates version in package.json, src/lib/version.ts, and CHANGELOG.md
 * 
 * Usage:
 *   npm run version:patch   # 1.0.0 -> 1.0.1
 *   npm run version:minor   # 1.0.0 -> 1.1.0
 *   npm run version:major   # 1.0.0 -> 2.0.0
 *   npm run version:set 1.2.3  # Set specific version
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const versionTsPath = path.join(process.cwd(), 'src/lib/version.ts');
const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function incrementVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated package.json to version ${newVersion}`);
}

function updateVersionTs(newVersion) {
  let content = fs.readFileSync(versionTsPath, 'utf8');
  content = content.replace(/export const APP_VERSION = ['"](.*?)['"];/, `export const APP_VERSION = '${newVersion}';`);
  fs.writeFileSync(versionTsPath, content);
  console.log(`✓ Updated src/lib/version.ts to version ${newVersion}`);
}

function updateChangelog(newVersion, currentVersion) {
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  
  // Get current date
  const date = new Date().toISOString().split('T')[0];
  
  // Create new release entry
  const newEntry = `## [${newVersion}] - ${date}

### Added
- 

### Changed
- 

### Fixed
- 

`;

  // Insert after [Unreleased] section
  changelog = changelog.replace(
    /## \[Unreleased\]\n\n/,
    `## [Unreleased]\n\n${newEntry}`
  );
  
  fs.writeFileSync(changelogPath, changelog);
  console.log(`✓ Updated CHANGELOG.md with version ${newVersion}`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const versionArg = args[1];
  
  const currentVersion = getCurrentVersion();
  let newVersion;
  
  if (command === 'set' && versionArg) {
    newVersion = versionArg;
  } else if (['major', 'minor', 'patch'].includes(command)) {
    newVersion = incrementVersion(currentVersion, command);
  } else {
    console.error('Usage:');
    console.error('  node scripts/update-version.js patch|minor|major');
    console.error('  node scripts/update-version.js set <version>');
    process.exit(1);
  }
  
  if (newVersion === currentVersion) {
    console.log(`Version is already ${currentVersion}`);
    process.exit(0);
  }
  
  console.log(`Updating version from ${currentVersion} to ${newVersion}...\n`);
  
  updatePackageJson(newVersion);
  updateVersionTs(newVersion);
  updateChangelog(newVersion, currentVersion);
  
  console.log(`\n✓ Version updated successfully to ${newVersion}`);
  console.log('\nNext steps:');
  console.log('  1. Review and update CHANGELOG.md with actual changes');
  console.log('  2. Commit changes: git add -A && git commit -m "chore: bump version to ' + newVersion + '"');
  console.log('  3. Create tag: git tag v' + newVersion);
  console.log('  4. Push: git push && git push --tags');
}

main();


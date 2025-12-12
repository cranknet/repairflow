/**
 * Interactive Tauri Build Script
 * 
 * Prompts for frontend URL/port before building the Tauri app.
 * Updates tauri.conf.json with the specified URL.
 * 
 * Environment Variables:
 *   TAURI_FRONTEND_URL - Default frontend URL (optional)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Load .env file if it exists
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
    // dotenv not required
}

const TAURI_CONF_PATH = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
const DEFAULT_URL = process.env.TAURI_FRONTEND_URL || 'http://localhost:3000';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('\n🔧 RepairFlow Tauri Build\n');
    console.log('This will build the desktop app with your specified frontend URL.\n');

    // Show default from env
    console.log(`Default URL (from env): ${DEFAULT_URL}\n`);
    console.log('Options:');
    console.log('  [Enter] - Use default URL');
    console.log('  1. http://localhost:3000');
    console.log('  2. Custom URL');
    console.log('');

    const choice = await question(`Enter choice or URL [${DEFAULT_URL}]: `);

    let frontendUrl;

    if (choice === '' || choice.toLowerCase() === 'default') {
        frontendUrl = DEFAULT_URL;
    } else if (choice === '1') {
        frontendUrl = 'http://localhost:3000';
    } else if (choice === '2') {
        const domain = await question('Enter domain (e.g., app.yoursite.com): ');
        const useHttps = await question('Use HTTPS? (Y/n): ');
        const protocol = useHttps.toLowerCase() === 'n' ? 'http' : 'https';
        frontendUrl = `${protocol}://${domain}`;
    } else if (choice.startsWith('http://') || choice.startsWith('https://')) {
        frontendUrl = choice;
    } else {
        // Assume it's a domain, add https
        frontendUrl = `https://${choice}`;
    }

    console.log(`\n📍 Frontend URL: ${frontendUrl}\n`);

    // Read current config
    const config = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf-8'));
    const previousUrl = config.build.frontendDist;

    // Update config
    config.build.frontendDist = frontendUrl;

    // Update CSP if it's a remote URL
    if (!frontendUrl.includes('localhost')) {
        const domain = new URL(frontendUrl).hostname;
        const baseDomain = domain.split('.').slice(-2).join('.');

        // Build a permissive CSP for the remote domain
        config.app.security.csp = `default-src 'self' ${frontendUrl} https://*.${baseDomain}; ` +
            `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${frontendUrl} https://*.${baseDomain}; ` +
            `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${frontendUrl}; ` +
            `font-src 'self' https://fonts.gstatic.com data:; ` +
            `img-src 'self' data: blob: https:; ` +
            `connect-src 'self' ${frontendUrl} https://*.${baseDomain} http://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.ocr.space https://api.httpsms.com`;

        console.log(`✅ Updated CSP for ${baseDomain}\n`);
    } else {
        // Reset to localhost CSP
        config.app.security.csp = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: http://localhost https:; connect-src 'self' http://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.ocr.space https://api.httpsms.com";
    }

    // Write updated config
    fs.writeFileSync(TAURI_CONF_PATH, JSON.stringify(config, null, 4));
    console.log('✅ Updated tauri.conf.json\n');

    // Confirm build
    const proceed = await question('Start build? (Y/n): ');

    if (proceed.toLowerCase() === 'n') {
        console.log('\n❌ Build cancelled. Config has been updated but not built.');
        console.log(`   To revert: set frontendDist back to "${previousUrl}"`);
        rl.close();
        return;
    }

    console.log('\n🔨 Building Tauri app...\n');
    rl.close();

    try {
        execSync('npm run tauri:build', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });

        console.log('\n✅ Build complete!');
        console.log('\n📦 Installers located at:');
        console.log('   MSI:  src-tauri/target/release/bundle/msi/');
        console.log('   NSIS: src-tauri/target/release/bundle/nsis/');
    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

main().catch(console.error);

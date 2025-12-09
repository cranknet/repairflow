import * as fs from 'fs';
import * as path from 'path';

const LOCALE_FILES = {
  en: 'public/locales/en/translation.json',
  ar: 'public/locales/ar/translation.json',
  fr: 'public/locales/fr/translation.json',
};

const MARKER = '[TRANSLATE]';

function loadLocale(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Error loading locale file ${filePath}:`, e);
    return {};
  }
}

function saveLocale(filePath: string, data: Record<string, string>): void {
  // Sort keys alphabetically
  const sorted: Record<string, string> = {};
  Object.keys(data).sort().forEach((key) => {
    sorted[key] = data[key];
  });
  
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
}

function main() {
    const enLocale = loadLocale(LOCALE_FILES.en);
    const frLocale = loadLocale(LOCALE_FILES.fr);
    const arLocale = loadLocale(LOCALE_FILES.ar);

    let frMarkedCount = 0;
    let arMarkedCount = 0;

    for (const key in enLocale) {
        if (Object.prototype.hasOwnProperty.call(enLocale, key)) {
            const englishValue = enLocale[key];

            // Mark French if it's identical to English and not already marked
            if (frLocale[key] === englishValue && !frLocale[key].startsWith(MARKER)) {
                frLocale[key] = `${MARKER} ${englishValue}`;
                frMarkedCount++;
            }
            // If key is missing in French, add it marked
            if (!(key in frLocale)) {
                frLocale[key] = `${MARKER} ${englishValue}`;
                frMarkedCount++;
            }

            // Mark Arabic if it's identical to English and not already marked
            if (arLocale[key] === englishValue && !arLocale[key].startsWith(MARKER)) {
                arLocale[key] = `${MARKER} ${englishValue}`;
                arMarkedCount++;
            }
            // If key is missing in Arabic, add it marked
            if (!(key in arLocale)) {
                arLocale[key] = `${MARKER} ${englishValue}`;
                arMarkedCount++;
            }
        }
    }

    saveLocale(LOCALE_FILES.fr, frLocale);
    saveLocale(LOCALE_FILES.ar, arLocale);

    console.log(`✅ Marked ${frMarkedCount} French entries for translation.`);
    console.log(`✅ Marked ${arMarkedCount} Arabic entries for translation.`);
    console.log(`Please translate entries starting with '${MARKER}' in ${LOCALE_FILES.fr} and ${LOCALE_FILES.ar}.`);
}

main();

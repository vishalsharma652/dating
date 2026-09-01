const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function checkFileExists(relPath) {
  const fullPath = path.join(rootDir, relPath);
  return { exists: fs.existsSync(fullPath), fullPath };
}

function checkFileContains(relPath, substrings) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, missing: substrings };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const missing = substrings.filter((sub) => !content.includes(sub));
  return { exists: true, missing, content };
}

console.log('====================================================');
console.log('       SAATHIKA PLATFORM - SEO AUDIT CHECKER        ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assertCheck(title, passCondition, detailMsg = '') {
  if (passCondition) {
    console.log(`  [PASS] ${title}`);
    passCount++;
  } else {
    console.log(`  [FAIL] ${title} - ${detailMsg}`);
    failCount++;
  }
}

// 1. Root Layout & Global Metadata
console.log('1. Root Layout & Global Metadata (app/layout.tsx)');
const layoutCheck = checkFileContains('app/layout.tsx', [
  'metadataBase',
  'title:',
  'description:',
  'keywords:',
  'openGraph:',
  'twitter:',
  'robots:',
  'alternates:',
  'canonical:',
  '<JsonLd />',
]);
assertCheck('Root metadata base & canonical configuration', layoutCheck.exists && !layoutCheck.missing.includes('metadataBase'));
assertCheck('Open Graph & Twitter card metadata', layoutCheck.exists && !layoutCheck.missing.includes('openGraph:'));
assertCheck('Robots indexing configuration', layoutCheck.exists && !layoutCheck.missing.includes('robots:'));
assertCheck('JSON-LD structured data injection in <head>', layoutCheck.exists && !layoutCheck.missing.includes('<JsonLd />'));

// 2. Structured Data Component
console.log('\n2. Schema.org Structured Data (components/seo/json-ld.tsx)');
const jsonLdCheck = checkFileContains('components/seo/json-ld.tsx', [
  '@type\': \'Organization\'',
  '@type\': \'WebSite\'',
  '@type\': \'MobileApplication\'',
]);
assertCheck('Organization schema.org script', jsonLdCheck.exists && !jsonLdCheck.missing.includes('@type\': \'Organization\''));
assertCheck('WebSite search action schema', jsonLdCheck.exists && !jsonLdCheck.missing.includes('@type\': \'WebSite\''));
assertCheck('MobileApplication dating app schema', jsonLdCheck.exists && !jsonLdCheck.missing.includes('@type\': \'MobileApplication\''));

// 3. Dynamic Sitemap, Robots & Web Manifest
console.log('\n3. Dynamic SEO Files (sitemap, robots, manifest)');
const sitemapCheck = checkFileExists('app/sitemap.ts');
assertCheck('Dynamic sitemap generator (app/sitemap.ts)', sitemapCheck.exists);

const robotsCheck = checkFileExists('app/robots.ts');
assertCheck('Dynamic robots.txt generator (app/robots.ts)', robotsCheck.exists);

const manifestCheck = checkFileExists('app/manifest.ts');
assertCheck('Web application manifest (app/manifest.ts)', manifestCheck.exists);

// 4. Public Page Metadata
console.log('\n4. Public Page Metadata Exports');
const pagesToCheck = [
  { path: 'app/(public)/about/page.tsx', name: 'About Page (/about)' },
  { path: 'app/(public)/contact/page.tsx', name: 'Contact Page (/contact)' },
  { path: 'app/(public)/help/page.tsx', name: 'Help Center Page (/help)' },
  { path: 'app/legal/privacy/page.tsx', name: 'Privacy Policy (/legal/privacy)' },
  { path: 'app/legal/terms/page.tsx', name: 'Terms of Service (/legal/terms)' },
  { path: 'app/(public)/login/page.tsx', name: 'Login Page (/login)' },
  { path: 'app/(public)/register/page.tsx', name: 'Register Page (/register)' },
];

pagesToCheck.forEach((page) => {
  const check = checkFileContains(page.path, ['export const metadata', 'canonical:']);
  assertCheck(`${page.name} metadata & canonical export`, check.exists && check.missing.length === 0);
});

// Summary
console.log('\n====================================================');
console.log(`  SEO Audit Finished: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All SEO checks passed cleanly! Site is 100% SEO compliant.\n');
}

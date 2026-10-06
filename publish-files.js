/**
 * SIGNES.STUDIO — One-click Transfer Publisher
 * Automatically builds all files routes, commits changes, and pushes live to GitHub Pages.
 */

const { execSync } = require('child_process');

console.log('--- Step 1: Building transfers & ZIP archives ---');
try {
  require('./build-files.js');
} catch (e) {
  console.error('Build failed:', e);
  process.exit(1);
}

console.log('\n--- Step 2: Preparing git commit ---');
try {
  execSync('git add .', { stdio: 'inherit' });
  
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    execSync('git commit -m "Update transfers"', { stdio: 'inherit' });
    console.log('Changes committed to git.');
  } else {
    console.log('No new changes to commit.');
  }

  console.log('\n--- Step 3: Pushing live to GitHub Pages ---');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('\n✅ All transfers are successfully deployed and live at https://signes.studio!');
} catch (err) {
  console.error('Git deployment error:', err.message);
  process.exit(1);
}


const http = require('http');
const fs = require('fs');
const path = require('path');

async function testAll() {
  console.log('=== STARTING AUDIT ===');
  
  // 1. Files existence
  const requiredFiles = ['portfolio.html', 'portfolio/index.html', 'portfolio.css', 'portfolio.js', '_headers'];
  for (const f of requiredFiles) {
    if (!fs.existsSync(f)) throw new Error('Missing file: ' + f);
    console.log('✓ File exists: ' + f);
  }

  // 2. HTML meta checks
  const html = fs.readFileSync('portfolio.html', 'utf8');
  if (!html.includes('content="noindex, nofollow"')) throw new Error('Missing noindex in portfolio.html');
  if (!html.includes('googlebot')) throw new Error('Missing googlebot tag in portfolio.html');
  console.log('✓ Privacy meta tags verified');

  // 3. Sitemap check
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  if (sitemap.includes('portfolio')) throw new Error('portfolio must NOT be in sitemap.xml');
  console.log('✓ Sitemap verified (no /portfolio)');

  // 4. Robots.txt check
  const robots = fs.readFileSync('robots.txt', 'utf8');
  if (robots.includes('portfolio')) throw new Error('robots.txt must NOT mention portfolio');
  console.log('✓ robots.txt verified (clean, does not block /portfolio)');

  // 5. Index.html public nav check
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  if (indexHtml.includes('/portfolio') || indexHtml.includes('portfolio.html')) {
    throw new Error('Public navigation or index.html must NOT link to private /portfolio');
  }
  console.log('✓ index.html verified (no link to private /portfolio)');

  // 6. Check image references in portfolio.html
  const imgMatches = html.match(/src="([^"]+)"/g) || [];
  const srcList = imgMatches.map(m => m.replace(/^src="|"$/g, ''));
  for (const s of srcList) {
    const cleanPath = decodeURIComponent(s.replace(/^\//, ''));
    if (!fs.existsSync(cleanPath)) throw new Error('Broken image path in HTML: ' + s);
    console.log('✓ Image exists on disk: ' + s);
  }

  // 7. Check OpenGraph image
  const ogMatch = html.match(/property="og:image" content="([^"]+)"/);
  if (!ogMatch) throw new Error('Missing og:image');
  const ogUrl = ogMatch[1];
  const ogPath = decodeURIComponent(ogUrl.replace('https://signes.studio/', ''));
  if (!fs.existsSync(ogPath)) throw new Error('Broken og:image on disk: ' + ogPath);
  console.log('✓ og:image exists on disk: ' + ogPath);

  // 8. Test HTTP server simulating GitHub Pages / clean URLs
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/portfolio') urlPath = '/portfolio.html';
    else if (urlPath === '/portfolio/') urlPath = '/portfolio/index.html';
    
    const filePath = path.join(__dirname, urlPath.replace(/^\//, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200);
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('404 Not Found');
    }
  });

  await new Promise(resolve => server.listen(8999, resolve));
  console.log('✓ Test HTTP server listening on :8999');

  const testUrls = [
    '/portfolio',
    '/portfolio/',
    '/portfolio.html',
    '/portfolio.css',
    '/portfolio.js',
    ...srcList
  ];

  for (const u of testUrls) {
    await new Promise((resolve, reject) => {
      http.get('http://localhost:8999' + u, res => {
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode + ' for ' + u));
        } else {
          console.log('✓ HTTP 200 OK: ' + u);
        }
        res.resume();
        resolve();
      }).on('error', reject);
    });
  }

  server.close();
  console.log('=== ALL AUDITS PASSED WITH 100% SUCCESS ===');
}

testAll().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

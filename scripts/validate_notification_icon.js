const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '..', 'app.json');

try {
  const raw = fs.readFileSync(appJsonPath, 'utf8');
  const app = JSON.parse(raw).expo;
  let iconPath = null;

  if (Array.isArray(app.plugins)) {
    for (const p of app.plugins) {
      if (Array.isArray(p) && p[0] === 'expo-notifications' && p[1] && p[1].icon) {
        iconPath = p[1].icon;
        break;
      }
    }
  }

  if (!iconPath) {
    console.log('No expo-notifications icon path found in app.json plugins.');
    process.exit(2);
  }

  const resolved = path.resolve(__dirname, '..', iconPath);
  console.log('Found icon path in app.json:', iconPath);
  console.log('Resolved filesystem path:', resolved);

  const exists = fs.existsSync(resolved);
  console.log('Exists:', exists);

  if (exists) {
    const stat = fs.statSync(resolved);
    console.log('File size (bytes):', stat.size);
    process.exit(0);
  } else {
    const dir = path.dirname(resolved);
    if (fs.existsSync(dir)) {
      console.log('Directory listing of', dir, ':', fs.readdirSync(dir));
    } else {
      console.log('Directory does not exist:', dir);
    }
    process.exit(1);
  }
} catch (e) {
  console.error('Error reading app.json or checking file:', e && e.message ? e.message : e);
  process.exit(3);
}

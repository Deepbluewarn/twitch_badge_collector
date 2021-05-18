//Modified code from https://github.com/trmcnvn/twitch-channel-points/blob/master/src/build.ts
const JSZip = require('node-zip');
import fs from 'fs';
const packageJson = require('../../package.json');

const FILES: string[] = [
  'manifest.json',
  '_locales/en/messages.json',
  '_locales/ko/messages.json',
  'public/popup.html',
  'dist/js/extension_background.js',
  'dist/js/inject_background.js',
  'dist/js/popup.js',
  'dist/css/inject_background.css',
  'dist/css/popup.css',
  'dist/css/fa/brands.css',
  'dist/css/fa/fontawesome.min.css',
  'dist/css/fa/solid.css',
  'public/icons/cc_icon128.png',
  'dist/webfonts/fa-brands-400.woff2',
  'dist/webfonts/fa-solid-900.woff2'
];

function run() {
  try {
    console.log('🔥 Starting build');
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build');
    }
    const zip = new JSZip();
    for (let file of FILES) {
      zip.file(file, fs.readFileSync(file));
    }
    const data = zip.generate({ type: 'nodebuffer' });
    fs.writeFileSync(`build/${packageJson.name}.zip`, data);
    console.log('🚀 Build finished');
  } catch (error) {
    console.error(error.message);
  }
}

run();
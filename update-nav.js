const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const link1 = `\n          <Link href="/dashboard/organigramme">· Organigramme</Link>`;
const link2 = `\n          <Link href="/portal/chat">· Chat interne</Link>`;

walk('./app/dashboard', (filePath) => {
  if (filePath.endsWith('page.tsx') || filePath.endsWith('layout.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Some use <Link href="/dashboard/organigramme">· Organigramme</Link> already?
    if (content.includes('<nav>') && !content.includes('/dashboard/organigramme')) {
      content = content.replace(/(<Link[^>]+>· [^<]+<\/Link>)\s*(<\/nav>)/, `$1${link1}$2`);
      changed = true;
    }
    if (content.includes('<nav>') && !content.includes('/portal/chat')) {
      content = content.replace(/(<Link[^>]+>· [^<]+<\/Link>)\s*(<\/nav>)/, `$1${link2}$2`);
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});

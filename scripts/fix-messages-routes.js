const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../src/app/api/www/messages');
const files = [];

function findFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath);
    } else if (entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }
}

findFiles(messagesDir);

console.log(`找到 ${files.length} 个文件\n`);

let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // 替换路径转换逻辑
  content = content.replace(
    /const backendPath = url\.pathname\.replace\(['"]\/api\/www\/['"], ['"]\/api\/['"]\);/g,
    'const backendPath = url.pathname;'
  );
  
  // 替换注释
  content = content.replace(
    /前端 \/api\/www\/messages\/\.\.\. → 后端 \/api\/messages\/\.\.\./g,
    '前端 /api/www/messages/... → 后端 /api/www/messages/...'
  );
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ ${file.replace(__dirname + '/../', '')}`);
    fixedCount++;
  }
}

console.log(`\n修复了 ${fixedCount} 个文件`);

const fs = require('fs');
const path = require('path');

// 要替换的路径映射
const replacements = [
  { from: '/api/auth/', to: '/api/www/auth/' },
  { from: '/api/messages/', to: '/api/www/messages/' },
  { from: '/api/contact-requests/', to: '/api/www/contact-requests/' },
  { from: '/api/contact-members/', to: '/api/www/contact-members/' },
  { from: '/api/profile/', to: '/api/www/profile/' },
  { from: '/api/email-settings/', to: '/api/www/email-settings/' },
];

// 查找所有 route.ts 文件
const apiDir = path.join(__dirname, '../src/app/api/www');
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

findFiles(apiDir);

console.log(`找到 ${files.length} 个文件\n`);

let replacedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const { from, to } of replacements) {
    const regex = new RegExp(from.replace(/\//g, '\\/'), 'g');
    content = content.replace(regex, to);
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ ${file.replace(__dirname + '/../', '')}`);
    replacedCount++;
  }
}

console.log(`\n替换了 ${replacedCount} 个文件`);

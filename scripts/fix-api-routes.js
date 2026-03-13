const fs = require('fs');
const path = require('path');

// 需要修复的路径映射
const replacements = [
  // www 路径
  { from: `/api/auth/`, to: `/api/www/auth/` },
  { from: `/api/messages/`, to: `/api/www/messages/` },
  { from: `/api/contact-requests/`, to: `/api/www/contact-requests/` },
  { from: `/api/contact-members/`, to: `/api/www/contact-members/` },
  { from: `/api/profile/`, to: `/api/www/profile/` },
  { from: `/api/email-settings/`, to: `/api/www/email-settings/` },
  // common 路径
  { from: `/api/products/`, to: `/api/common/products/` },
  { from: `/api/inquiries/`, to: `/api/common/inquiries/` },
  { from: `/api/news/`, to: `/api/common/news/` },
];

const filesToCheck = [];

// 递归查找所有 route.ts 文件
function findRouteFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findRouteFiles(fullPath);
    } else if (file === 'route.ts') {
      filesToCheck.push(fullPath);
    }
  }
}

findRouteFiles(path.join(__dirname, '../src/app/api'));

console.log(`找到 ${filesToCheck.length} 个 route.ts 文件\n`);

let fixedCount = 0;

for (const file of filesToCheck) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;
  
  for (const { from, to } of replacements) {
    // 只替换 API_CONFIG.backendURL 后面的路径
    const regex = new RegExp(`API_CONFIG\\.backendURL\\}\`${from}`, 'g');
    content = content.replace(regex, `API_CONFIG.backendURL}\`${to}`);
    
    // 也替换直接字符串拼接的情况
    const regex2 = new RegExp(`API_CONFIG\\.backendURL \\+ \`${from}`, 'g');
    content = content.replace(regex2, `API_CONFIG.backendURL + \`${to}`);
    
    // 也替换直接字符串的情况
    const regex3 = new RegExp(`API_CONFIG\\.backendURL \\+ '${from}`, 'g');
    content = content.replace(regex3, `API_CONFIG.backendURL + '${to}`);
  }
  
  // 修复通用代理逻辑（replace('/api/www/', '/api/')）
  if (file.includes('/www/')) {
    content = content.replace(
      /replace\(['"]\/api\/www\/['"], ['"]\/api\/['"]\)/g,
      "pathname"
    );
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✓ ${file.replace(__dirname + '/../', '')}`);
    fixedCount++;
  }
}

console.log(`\n共修复 ${fixedCount} 个文件`);

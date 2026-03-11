# Banner 图片上传工具

## 功能说明
此工具用于将本地的 banner 图片上传到对象存储，并生成签名 URL 供网站使用。

## 使用步骤

### 1. 准备图片

将你的 banner 图片放到以下目录：
```
public/assets/images/banner/
```

支持的图片格式：
- JPG / JPEG
- PNG
- GIF
- WebP

图片命名建议：
- `banner-1.jpg`
- `banner-2.jpg`
- `banner-3.jpg`

### 2. 运行上传工具

在项目根目录运行：
```bash
pnpm upload-banner
```

### 3. 查看结果

脚本会：
1. 自动检测 `public/assets/images/banner/` 目录中的所有图片
2. 逐个上传到对象存储
3. 生成签名 URL（有效期 1 年）
4. 输出可直接复制的配置代码

### 4. 应用到代码

复制脚本输出的代码，粘贴到 `src/app/[locale]/page.tsx` 文件中。

---

## 示例输出

```
=== Banner 图片上传工具 ===

找到 2 张图片:

  1. banner-1.jpg
  2. banner-2.jpg

开始上传...

正在上传: banner-1.jpg...
✓ 上传成功: banner-1.jpg -> banners/banner-1_abc123def456.jpg

正在上传: banner-2.jpg...
✓ 上传成功: banner-2.jpg -> banners/banner-2_xyz789ghi012.jpg

=== 上传完成 ===

生成的签名 URL (有效期 1 年):

1. banner-1.jpg
   Key: banners/banner-1_abc123def456.jpg
   URL: https://example.com/banners/banner-1_abc123def456.jpg?signature=...

2. banner-2.jpg
   Key: banners/banner-2_xyz789ghi012.jpg
   URL: https://example.com/banners/banner-2_xyz789ghi012.jpg?signature=...

=== 复制以下代码到 src/app/[locale]/page.tsx ===

// 多张轮播 banner 图片
const bannerImages = [
  "https://example.com/banners/banner-1_abc123def456.jpg?signature=...",
  "https://example.com/banners/banner-2_xyz789ghi012.jpg?signature=...",
];

✅ 配置完成！
```

---

## 注意事项

1. **图片大小**
   - 建议每张图片不超过 5MB
   - 推荐尺寸：1920x800 或以上
   - 可以使用在线工具压缩图片（如 TinyPNG）

2. **URL 有效期**
   - 默认生成的签名 URL 有效期为 1 年
   - 过期后需要重新上传或生成新的签名 URL

3. **文件命名**
   - SDK 会自动添加 UUID 前缀防止冲突
   - 不需要担心文件名重复问题

4. **修改代码**
   - 复制脚本输出的代码到 `src/app/[locale]/page.tsx`
   - 替换现有的 banner 配置

---

## 故障排除

### 问题：提示 "coze-coding-dev-sdk 未安装"
**解决方案：**
```bash
pnpm install
```

### 问题：提示 "目录中没有找到图片文件"
**解决方案：**
- 确保 `public/assets/images/banner/` 目录存在
- 确保目录中有图片文件
- 确保文件名不以 `.` 开头（隐藏文件会被忽略）

### 问题：上传失败
**可能原因：**
1. 网络连接问题
2. 对象存储配置问题
3. 图片文件损坏

**解决方案：**
- 检查网络连接
- 查看错误信息
- 尝试重新上传

---

## 后续优化

### 管理后台集成
后续可以在管理后台中：
1. 实现图片上传功能
2. 管理多张 banner 图片
3. 设置轮播顺序和时间
4. 预览 banner 效果

### 动态加载
可以创建 API 接口，动态获取 banner 列表：
```typescript
// app/api/banners/route.ts
import { S3Storage } from "coze-coding-dev-sdk";

export async function GET() {
  const storage = new S3Storage();
  const result = await storage.listFiles({ prefix: "banners/" });

  const banners = await Promise.all(
    result.keys.map(async (key) => ({
      key,
      url: await storage.generatePresignedUrl({ key, expireTime: 86400 }),
    }))
  );

  return Response.json({ banners });
}
```

然后在首页动态加载：
```typescript
const { banners } = await fetch('/api/banners').then(r => r.json());
```

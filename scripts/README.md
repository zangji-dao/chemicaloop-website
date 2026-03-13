# 脚本目录

## 目录结构

```
scripts/
├── dev/          # 项目生命周期脚本
├── seed/         # 种子数据/测试数据
├── batch/        # 批量处理脚本
└── sync/         # 数据同步/导入
```

## 详细说明

### dev/ - 项目生命周期

| 脚本 | 用途 | 命令 |
|------|------|------|
| `dev.sh` | 启动开发环境 | `./scripts/dev/dev.sh` |
| `build.sh` | 构建生产版本 | `./scripts/dev/build.sh` |
| `start.sh` | 启动生产服务 | `./scripts/dev/start.sh` |
| `prepare.sh` | 环境准备 | `./scripts/dev/prepare.sh` |

### seed/ - 种子数据

| 脚本 | 用途 | 命令 |
|------|------|------|
| `seed-messages.ts` | 生成测试消息数据 | `pnpm tsx scripts/seed/seed-messages.ts` |
| `seed-contact-data.ts` | 生成测试联系人数据 | `pnpm tsx scripts/seed/seed-contact-data.ts` |
| `create-inbox-messages.ts` | 创建收件箱消息 | `pnpm tsx scripts/seed/create-inbox-messages.ts` |
| `add-english-message.ts` | 添加英文测试消息 | `pnpm tsx scripts/seed/add-english-message.ts` |

### batch/ - 批量处理

| 脚本 | 用途 | 命令 |
|------|------|------|
| `batch-translate-products.ts` | 批量翻译产品 | `pnpm tsx scripts/batch/batch-translate-products.ts` |
| `batch-translate-spu.ts` | 批量翻译 SPU | `pnpm tsx scripts/batch/batch-translate-spu.ts` |
| `batch-translate-en-names.ts` | 批量翻译英文名称 | `pnpm tsx scripts/batch/batch-translate-en-names.ts` |
| `batch-update-all-translations.ts` | 更新所有翻译 | `pnpm tsx scripts/batch/batch-update-all-translations.ts` |
| `fix-product-names-and-translate.ts` | 修复产品名称并翻译 | `pnpm tsx scripts/batch/fix-product-names-and-translate.ts` |
| `generate-product-images.ts` | 批量生成产品图片 | `pnpm tsx scripts/batch/generate-product-images.ts` |
| `generate-spu-images.ts` | 批量生成 SPU 图片 | `pnpm tsx scripts/batch/generate-spu-images.ts` |
| `upload-banner-images.ts` | 上传 Banner 图片 | `pnpm tsx scripts/batch/upload-banner-images.ts` |
| `upload-banner.sh` | Banner 上传脚本 | `./scripts/batch/upload-banner.sh` |
| `list-banners.ts` | 列出所有 Banner | `pnpm tsx scripts/batch/list-banners.ts` |
| `list-product-images.ts` | 列出产品图片 | `pnpm tsx scripts/batch/list-product-images.ts` |

### sync/ - 数据同步

| 脚本 | 用途 | 命令 |
|------|------|------|
| `sync-trade-data.ts` | 同步贸易数据 | `pnpm tsx scripts/sync/sync-trade-data.ts` |
| `import-customs-data.ts` | 导入海关数据 | `pnpm tsx scripts/sync/import-customs-data.ts` |

## 新增脚本规范

新增脚本时，按以下规则选择目录：

| 脚本类型 | 放置目录 | 示例 |
|----------|----------|------|
| 项目启动/构建/部署 | `dev/` | `deploy.sh` |
| 生成测试/演示数据 | `seed/` | `seed-users.ts` |
| 批量处理现有数据 | `batch/` | `batch-delete-duplicates.ts` |
| 从外部同步/导入数据 | `sync/` | `sync-from-erp.ts` |

# 响应式等比缩放系统

## 设计理念

本系统采用 **CSS `clamp()` 函数 + 响应式单位** 实现真正的等比缩放，而不是传统的断点切换。

### 核心优势

✅ **平滑缩放**：所有元素随窗口尺寸连续变化，无跳跃感
✅ **最小值限制**：防止在小屏幕上过小影响可读性
✅ **最大值限制**：防止在大屏幕上过大影响美观
✅ **开发友好**：统一的工具类，快速应用

## clamp() 语法

```css
clamp(最小值, 首选值, 最大值)
```

### 示例

```css
/* 字体大小：最小 16px，首选 2vw（视口宽度的 2%），最大 24px */
font-size: clamp(16px, 2vw, 24px);

/* 间距：最小 1rem，首选 2vw，最大 2rem */
padding: clamp(1rem, 2vw, 2rem);
```

## 工具类列表

### 文字大小

| 类名 | 最小值 | 首选值 | 最大值 |
|------|--------|--------|--------|
| `text-h1` | 1.75rem (28px) | 3vw | 3.5rem (56px) |
| `text-h2` | 1.5rem (24px) | 2.5vw | 2.5rem (40px) |
| `text-h3` | 1.25rem (20px) | 2vw | 1.875rem (30px) |
| `text-body` | 0.875rem (14px) | 1vw | 1rem (16px) |
| `text-small` | 0.75rem (12px) | 0.85vw | 0.875rem (14px) |

### 间距

| 类名 | 最小值 | 首选值 | 最大值 |
|------|--------|--------|--------|
| `gap-responsive` | 1rem | 2vw | 2rem |
| `p-responsive` | 1rem | 2vw | 2rem |
| `px-responsive` | 1rem | 2vw | 2rem |
| `py-responsive` | 1rem | 2vw | 2rem |
| `m-responsive` | 1rem | 2vw | 2rem |
| `mx-responsive` | 1rem | 2vw | 2rem |
| `my-responsive` | 1rem | 2vw | 2rem |

### 组件

| 类名 | 说明 |
|------|------|
| `btn-responsive` | 按钮等比缩放 |
| `card-responsive` | 卡片等比缩放 |
| `input-responsive` | 输入框等比缩放 |
| `container-responsive` | 容器宽度（90%-95vw-1400px） |
| `banner-height` | Banner 高度（280px-25vw-500px） |
| `logo-responsive` | Logo 尺寸（120px-12vw-200px） |
| `nav-height` | 导航高度（60px-6vw-80px） |
| `grid-gap-sm` | 小网格间距（0.5rem-1vw-1rem） |
| `grid-gap-md` | 中网格间距（1rem-2vw-2rem） |
| `grid-gap-lg` | 大网格间距（1.5rem-3vw-3rem） |

## 使用示例

### 1. 标题

```tsx
<h1 className="text-h1 font-bold">
  大标题
</h1>
```

### 2. 段落

```tsx
<p className="text-body text-gray-600">
  正文内容
</p>
```

### 3. 按钮

```tsx
<button className="btn-responsive bg-blue-600 text-white">
  提交
</button>
```

### 4. 卡片

```tsx
<div className="card-responsive bg-white shadow">
  <h3 className="text-h3">标题</h3>
  <p className="text-body">内容</p>
</div>
```

### 5. Banner

```tsx
<section className="relative banner-height">
  <div className="absolute inset-0">
    <img src="/banner.jpg" className="w-full h-full object-cover" />
  </div>
  <div className="relative h-full flex items-center justify-center px-responsive">
    <div className="container-responsive">
      <h1 className="text-h1">标题</h1>
    </div>
  </div>
</section>
```

### 6. 网格

```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 grid-gap-lg">
  {items.map(item => (
    <div key={item.id} className="card-responsive">
      {/* 内容 */}
    </div>
  ))}
</div>
```

## 断点配合

虽然主要使用等比缩放，但在某些情况下仍需配合断点：

```tsx
/* 保持网格列数变化 */
<div className="grid md:grid-cols-2 lg:grid-cols-3 grid-gap-lg">

/* 移动/PC 导航切换 */
<div className="lg:hidden">移动导航</div>
<div className="hidden lg:block">PC 导航</div>
```

## 视口范围

| 视口宽度 | 效果 |
|---------|------|
| 320px - 640px | 最小值生效，保证可读性 |
| 640px - 1024px | 首选值生效，等比缩放 |
| 1024px - 1920px | 首选值 + 最大值过渡 |
| 1920px+ | 最大值生效，不再放大 |

## 自定义等比缩放

如需自定义元素的缩放，使用 `clamp()` 函数：

```css
.custom-element {
  /* 语法：clamp(最小值, 首选值, 最大值) */
  font-size: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(0.5rem, 1.5vw, 1.5rem);
  border-radius: clamp(0.25rem, 0.5vw, 0.5rem);
}
```

### 推荐比例

| 元素类型 | 最小值 | 首选值 | 最大值 |
|---------|--------|--------|--------|
| 大标题 | 2rem | 3-4vw | 4rem |
| 正文 | 1rem | 1-1.5vw | 1.25rem |
| 按钮内边距 | 0.5rem | 1-1.5vw | 1rem |
| 卡片内边距 | 1rem | 2-3vw | 2rem |
| 间距 | 0.5rem | 1-2vw | 2rem |

## 注意事项

1. **不要过度使用 `vw`**：避免所有元素都用 `vw`，某些固定尺寸元素仍用 `rem`/`px`
2. **保留断点系统**：布局变化（如 1 列变 2 列）仍需使用断点
3. **测试多种设备**：在小屏手机、平板、桌面、大屏上都要测试
4. **根字体设置**：已设置 `font-size: clamp(14px, 0.8vw, 18px)`，影响所有 `rem` 单位

## 浏览器兼容性

- ✅ Chrome/Edge: 79+
- ✅ Firefox: 75+
- ✅ Safari: 13.1+
- ✅ iOS Safari: 13.4+
- ✅ Android Chrome: 79+

## 已应用页面

- ✅ Home 页面（Banner、标题）
- ✅ Products 页面（完整页面）
- 🔄 其他页面（待应用）

'use client';

import Image from 'next/image';

interface PageBannerProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 背景图片 URL */
  backgroundImage?: string;
  /** 子标题显示在标题上方 */
  subtitleAbove?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子内容（替换默认的标题/副标题） */
  children?: React.ReactNode;
}

/**
 * 页面 Banner 组件
 * 
 * 使用方式：
 * ```tsx
 * <PageBanner
 *   title="Chemical Products"
 *   subtitle="Browse our catalog..."
 *   backgroundImage="https://..."
 * />
 * ```
 */
export default function PageBanner({
  title,
  subtitle,
  backgroundImage = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1920&q=80',
  subtitleAbove = false,
  className = '',
  children,
}: PageBannerProps) {
  return (
    <section className={`relative h-banner overflow-hidden ${className}`}>
      {/* 背景渐变层 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700">
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            className="w-full h-full object-cover opacity-30"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
      </div>

      {/* 内容区域 - 底部对齐 */}
      <div className="relative h-full flex items-end justify-center px-4 pb-8 lg:pb-12">
        {children || (
          <div className="text-center text-white max-w-4xl">
            {subtitleAbove && subtitle && (
              <p className="text-lg md:text-xl opacity-90 mb-2">{subtitle}</p>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              {title}
            </h1>
            {!subtitleAbove && subtitle && (
              <p className="text-lg md:text-xl opacity-90">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

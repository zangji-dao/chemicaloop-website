'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import { bannerConfig, getBannerImages } from '@/config/banner';

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerImages, setBannerImages] = useState<string[]>([]);

  // 从 pathname 中提取语言（验证有效性）
  const validLocales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'];
  const pathParts = pathname.split('/');
  const rawLocale = pathParts[1] || 'en';
  const locale = validLocales.includes(rawLocale) ? rawLocale : 'en';

  // 判断是否为 RTL 语言（目前只有阿拉伯语）
  const isRTL = locale === 'ar';

  // 初始化 banner 图片
  useEffect(() => {
    const images = getBannerImages();
    setBannerImages(images);
  }, []);

  // 轮播逻辑
  useEffect(() => {
    if (bannerConfig.mode === 'carousel' && bannerImages.length > 1 && bannerConfig.carousel.autoPlay) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
      }, bannerConfig.carousel.interval);

      return () => clearInterval(interval);
    }
  }, [bannerImages]);

  const currentBannerUrl = bannerImages[currentBannerIndex] || '';
  const hasBanner = currentBannerUrl.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section - 全屏 Banner */}
        <section className="relative w-full h-screen overflow-hidden">
          {hasBanner ? (
            <>
              {/* Banner 轮播 */}
              {bannerImages.map((url, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load banner image: ${url}`);
                      if (index === currentBannerIndex && bannerImages.length > 1) {
                        setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
                      }
                    }}
                  />
                  {/* 渐变遮罩，确保文字可读 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-700/60" />
                </div>
              ))}

              {/* 轮播控制 - 指示点 */}
              {bannerConfig.carousel.showDots && bannerImages.length > 1 && (
                <div className="absolute bottom-responsive left-1/2 transform -translate-x-1/2 flex gap-responsive z-20">
                  {bannerImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentBannerIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentBannerIndex(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* 轮播控制 - 左右箭头 */}
              {bannerConfig.carousel.showArrows && bannerImages.length > 1 && (
                <>
                  <button
                    className="absolute left-2 sm:left-4 md:left-6 lg:left-responsive top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 md:p-4 rounded-full transition-colors z-20 backdrop-blur-sm"
                    onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}
                    aria-label="Previous slide"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-2 sm:right-4 md:right-6 lg:right-responsive top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 md:p-4 rounded-full transition-colors z-20 backdrop-blur-sm"
                    onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length)}
                    aria-label="Next slide"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </>
          ) : (
            // 默认渐变背景（如果没有配置 banner）
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500" />
          )}

          {/* 内容层 */}
          <div className="relative z-10 h-full flex items-center justify-center px-responsive" style={{ paddingTop: 'clamp(60px, 6vw, 80px)' }}>
            <div className="container-responsive max-w-5xl text-white text-center" style={{ marginTop: 'clamp(32px, 4vw, 48px)' }}>
              {/* Banner 1: 数字突出布局 - 居中 */}
              {currentBannerIndex === 0 && (
                <>
                  {/* 主标题 */}
                  <h1 className="text-h1 font-bold leading-tight mb-8 animate-fade-in relative mx-auto" style={{
                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.03em',
                    fontWeight: '800',
                    lineHeight: '1.2',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}>
                    {t('heroTitle')}
                  </h1>

                  {/* 数字突出展示 */}
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-10 animate-fade-in-up mx-auto" style={{
                    animationDelay: '0.1s',
                    maxWidth: '800px',
                  }}>
                    <div className="flex flex-col items-center">
                      <div className="text-6xl md:text-7xl font-bold mb-2" style={{
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: '900',
                        lineHeight: '1',
                      }}>
                        1,000+
                      </div>
                      <span className="text-lg font-medium opacity-90">Agents</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-6xl md:text-7xl font-bold mb-2" style={{
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: '900',
                        lineHeight: '1',
                      }}>
                        50+
                      </div>
                      <span className="text-lg font-medium opacity-90">Countries</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-6xl md:text-7xl font-bold mb-2" style={{
                        background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: '900',
                        lineHeight: '1',
                      }}>
                        3,000+
                      </div>
                      <span className="text-lg font-medium opacity-90">Factories</span>
                    </div>
                  </div>

                  {/* 内容 */}
                  <p className="text-xl md:text-2xl opacity-95 leading-relaxed mb-10 animate-fade-in-up relative mx-auto" style={{
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    maxWidth: '800px',
                    lineHeight: '1.7',
                    letterSpacing: '0.01em',
                    fontWeight: '400',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    animationDelay: '0.2s',
                  }}>
                    {t('heroSubtitle')}
                  </p>

                  {/* 按钮 */}
                  <a href="/contact"
                     className="bg-white text-blue-700 px-12 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 inline-block shadow-2xl hover:shadow-white/50 hover:-translate-y-1 animate-fade-in-up relative"
                     style={{
                       textShadow: 'none',
                       letterSpacing: '0.02em',
                       fontWeight: '700',
                       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                       background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                       animationDelay: '0.3s',
                     }}>
                    {t('heroCta')}
                  </a>
                </>
              )}

              {/* Banner 2: 方案二 - 左对齐+装饰线 */}
              {currentBannerIndex === 1 && (
                <div className="text-left">
                  {/* 装饰线 - 顶部 */}
                  <div className="w-24 h-1 bg-gradient-to-r from-white to-white/30 mb-8 animate-fade-in" style={{
                    borderRadius: '2px',
                  }}></div>

                  {/* 标题 */}
                  <h1 className="text-h1 font-bold leading-tight animate-fade-in-up relative" style={{
                    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.03em',
                    fontWeight: '800',
                    lineHeight: '1.2',
                    marginBottom: '2rem',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  }}>
                    {t('heroTitle2')}
                  </h1>

                  {/* 装饰线 - 标题下方 */}
                  <div className="w-16 h-0.5 bg-gradient-to-r from-white/50 to-transparent mb-8 animate-fade-in-up" style={{
                    animationDelay: '0.1s',
                  }}></div>

                  {/* 内容 */}
                  <p className="text-xl md:text-2xl opacity-95 leading-relaxed animate-fade-in-up relative" style={{
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    maxWidth: '850px',
                    marginBottom: '2.5rem',
                    lineHeight: '1.7',
                    letterSpacing: '0.01em',
                    fontWeight: '400',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    animationDelay: '0.2s',
                  }}>
                    {t('heroSubtitle2')}
                  </p>

                  {/* 按钮 */}
                  <a href="/agent"
                     className="bg-white text-blue-700 px-12 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 inline-block shadow-2xl hover:shadow-white/50 hover:-translate-y-1 animate-fade-in-up relative"
                     style={{
                       textShadow: 'none',
                       letterSpacing: '0.02em',
                       fontWeight: '700',
                       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                       background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                       animationDelay: '0.3s',
                     }}>
                    {t('heroCta2')}
                  </a>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Introduction & Video Section */}
        <section className="py-responsive px-responsive bg-white overflow-hidden">
          <div className="container-responsive mx-auto">
            <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-end space-y-12">
              {/* Left: Introduction Text */}
              <div className="lg:pr-8">
                {/* Title Section */}
                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-3">
                    {t('welcomeTitle')} <span className="text-blue-600">CHEMICALOOP</span>
                  </h2>
                  {/* Divider */}
                  <div className="w-20 h-1 bg-blue-600 mb-4 rounded"></div>
                  <p className="text-xl md:text-2xl text-blue-700 font-normal">
                    {t('tradePartner')}
                  </p>
                </div>

                {/* Description Text */}
                <div className="text-body text-gray-700 leading-relaxed">
                  <p>{t('introText1')} {t('introText2')} {t('introText3')}</p>
                </div>
              </div>

              {/* Right: Video Section */}
              <div className={`relative ${isRTL ? 'lg:mr-auto lg:w-[calc(100%+10vw)] lg:ml-[-10vw]' : 'lg:ml-auto lg:w-[calc(100%+10vw)] lg:mr-[-10vw]'}`}>
                <div className="bg-gray-100 overflow-hidden shadow-2xl h-auto">
                  <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center relative w-full" style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: 'clamp(300px, 40vw, 600px)'
                  }}>
                    {/* Mask Overlay */}
                    <div className="absolute inset-0 bg-blue-900/60"></div>

                    {/* Video Placeholder */}
                    <div className="relative z-10 text-center text-white p-responsive">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-responsive backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors">
                        <svg className={`w-8 h-8 ${isRTL ? 'mr-1' : 'ml-1'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-body font-medium mb-responsive">{t('videoTitle')}</p>
                      <p className="text-small opacity-80">{t('videoSubtitle')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Key Points Section - Blue Theme */}
        <section className="py-responsive px-responsive bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
          <div className="container-responsive mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 grid-gap-lg">
              {/* Point 1 */}
              <div className="flex flex-col items-center text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-responsive shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-responsive" style={{ fontSize: 'clamp(0.9375rem, 1.5vw, 1.25rem)', lineHeight: '1.4' }}>{t('introPoint1')}</h3>
                <p className="text-white/90 leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('introPoint1Desc')}</p>
              </div>

              {/* Point 2 */}
              <div className="flex flex-col items-center text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-responsive" style={{ fontSize: 'clamp(0.9375rem, 1.5vw, 1.25rem)', lineHeight: '1.4' }}>{t('introPoint2')}</h3>
                <p className="text-white/90 leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('introPoint2Desc')}</p>
              </div>

              {/* Point 3 */}
              <div className="flex flex-col items-center text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-responsive shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-responsive" style={{ fontSize: 'clamp(0.9375rem, 1.5vw, 1.25rem)', lineHeight: '1.4' }}>{t('introPoint3')}</h3>
                <p className="text-white/90 leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('introPoint3Desc')}</p>
              </div>

              {/* Point 4 */}
              <div className="flex flex-col items-center text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-responsive shadow-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M3 21h18M5 11l7-7 7 7M5 11V7h14v4" />
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-responsive" style={{ fontSize: 'clamp(0.9375rem, 1.5vw, 1.25rem)', lineHeight: '1.4' }}>{t('introPoint4')}</h3>
                <p className="text-white/90 leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('introPoint4Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integrated Stats & Features Section */}
        <section className="py-responsive px-responsive bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <div className="container-responsive mx-auto">
            {/* Section Title */}
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-h2 font-bold text-blue-900 mb-responsive">
                {t('statsTitle')}
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 grid-gap-lg items-center">
              {/* Left: Stats */}
              <div className="space-y-responsive">
                <div className="grid grid-cols-2 grid-gap-md">
                  <div className="bg-white rounded-2xl p-responsive shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100">
                    <div className="flex items-baseline gap-2 md:gap-3 mb-responsive">
                      <div className="text-h1 font-bold text-blue-600 leading-none">1,000+</div>
                      <div className="text-caption text-gray-500">{t('statsAgents')}</div>
                    </div>
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                  </div>
                  <div className="bg-white rounded-2xl p-responsive shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100">
                    <div className="flex items-baseline gap-2 md:gap-3 mb-responsive">
                      <div className="text-h1 font-bold text-blue-600 leading-none">50+</div>
                      <div className="text-caption text-gray-500">{t('statsCountries')}</div>
                    </div>
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                  </div>
                  <div className="bg-white rounded-2xl p-responsive shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100">
                    <div className="flex items-baseline gap-2 md:gap-3 mb-responsive">
                      <div className="text-h1 font-bold text-blue-600 leading-none">3,000+</div>
                      <div className="text-caption text-gray-500">{t('statsProducts')}</div>
                    </div>
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                  </div>
                  <div className="bg-white rounded-2xl p-responsive shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100">
                    <div className="flex items-baseline gap-2 md:gap-3 mb-responsive">
                      <div className="text-h1 font-bold text-blue-600 leading-none">700+</div>
                      <div className="text-caption text-gray-500">{t('statsFactories')}</div>
                    </div>
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Right: Features */}
              <div className="space-y-4 sm:space-y-5 md:space-y-responsive">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-5 md:p-responsive text-white shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-responsive">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold mb-2 sm:mb-3 md:mb-responsive" style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)', lineHeight: '1.4' }}>{t('featuresQuality.title')}</h3>
                      <p className="text-white/90 leading-relaxed line-clamp-3" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('featuresQuality.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-responsive shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100">
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-responsive">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-blue-900 mb-2 sm:mb-3 md:mb-responsive" style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)', lineHeight: '1.4' }}>{t('featuresReliability.title')}</h3>
                      <p className="text-gray-600 leading-relaxed line-clamp-3" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('featuresReliability.description')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-responsive shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-blue-100">
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-responsive">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-blue-900 mb-2 sm:mb-3 md:mb-responsive" style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)', lineHeight: '1.4' }}>{t('featuresExpertise.title')}</h3>
                      <p className="text-gray-600 leading-relaxed line-clamp-3" style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.875rem)', lineHeight: '1.5' }}>{t('featuresExpertise.description')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-responsive px-responsive">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-body">&copy; 2024 Chemicaloop. {tCommon('allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
}

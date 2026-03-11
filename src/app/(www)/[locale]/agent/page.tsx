'use client';

import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import PageBanner from '@/components/PageBanner';

export default function AgentPage() {
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Banner */}
      <PageBanner
        title={t('title')}
        subtitle={t('subtitle')}
        backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1920&q=80"
      />

      <main className="flex-1 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-900">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold mb-4 text-blue-900">{t('introTitle')}</h2>
            <p className="text-lg text-gray-700 mb-6">{t('introText')}</p>
            <p className="text-lg text-gray-700">{t('introText2')}</p>
          </div>

          {/* Why Join Us */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-blue-900">{t('whyJoinTitle')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{t('benefits.1.title')}</h3>
                <p className="text-gray-600 text-center">{t('benefits.1.description')}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{t('benefits.2.title')}</h3>
                <p className="text-gray-600 text-center">{t('benefits.2.description')}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{t('benefits.3.title')}</h3>
                <p className="text-gray-600 text-center">{t('benefits.3.description')}</p>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-blue-900">{t('requirementsTitle')}</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <ul className="space-y-4">
                {['1', '2', '3', '4', '5'].map((index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{t(`requirements.${index}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Application Process */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-blue-900">{t('processTitle')}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {['1', '2', '3', '4'].map((step) => (
                <div key={step} className="relative">
                  <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                    {step}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-center">{t(`process.${step}.title`)}</h3>
                  <p className="text-gray-600 text-center text-sm">{t(`process.${step}.description`)}</p>
                  {step !== '4' && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-blue-300 transform translate-x-4"></div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-blue-600 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('ctaTitle')}</h2>
            <p className="text-xl mb-8 opacity-90">{t('ctaSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`mailto:agent@chemicaloop.com?subject=${encodeURIComponent(t('emailSubject'))}`} className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                {t('applyNow')}
              </a>
              <a href={`mailto:${tCommon('emailAddress')}`} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                {t('contactUs')}
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Chemicaloop. {tCommon('allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import Header from '@/components/Header';
import PageBanner from '@/components/PageBanner';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Banner */}
      <PageBanner
        title={t('title')}
        subtitle={t('subtitle')}
        backgroundImage="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80"
      />

      <main className="flex-1 pb-responsive px-responsive">
        <div className="container-responsive mx-auto">
          <div className="grid md:grid-cols-2 grid-gap-large">
            {/* Contact Form */}
            <div className="bg-white p-responsive rounded-lg shadow-lg">
              <h2 className="text-h2 font-bold mb-responsive text-blue-900">{t('formTitle')}</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-body font-medium mb-responsive">{t('name')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium mb-responsive">{t('email')}</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium mb-responsive">{t('phone')}</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium mb-responsive">{t('company')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium mb-responsive">{t('subject')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium mb-responsive">{t('message')}</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {t('submit')}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <div className="bg-blue-50 p-responsive rounded-lg mb-responsive">
                <h2 className="text-h2 font-bold mb-responsive text-blue-900">{t('infoTitle')}</h2>
                <div className="space-y-responsive">
                  <div>
                    <div className="font-medium text-blue-700">{t('address')}</div>
                    <div className="text-body text-gray-700">{t('addressValue')}</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">{t('phoneLabel')}</div>
                    <div className="text-body text-gray-700">{tCommon('phoneNumber')}</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-700">{t('emailLabel')}</div>
                    <div className="text-body text-gray-700">{tCommon('emailAddress')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-responsive rounded-lg">
                <h2 className="text-h2 font-bold mb-responsive text-blue-900">{t('hoursTitle')}</h2>
                <div className="space-y-responsive text-body text-gray-700">
                  <div>{t('hours')}</div>
                  <div>{t('hoursWeekend')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

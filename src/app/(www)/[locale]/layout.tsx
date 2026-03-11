import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n';
import Providers from '@/components/Providers';
import AdminSwitchButton from '@/components/AdminSwitchButton';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages({ locale }) as any;
  
  const common = messages.common || {};
  const home = messages.home || {};
  
  return {
    title: {
      default: common.siteTitle || home.title || 'Chemicaloop - Global Chemical Distribution',
      template: `%s | ${common.siteName || 'Chemicaloop'}`,
    },
    description: common.siteDescription || home.subtitle || 'Your Trusted Partner in Chemical Distribution Solutions',
  };
}

export default async function WwwLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={`antialiased`}>
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </Providers>
        <AdminSwitchButton />
      </body>
    </html>
  );
}

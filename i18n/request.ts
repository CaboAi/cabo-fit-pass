import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
 
const locales = ['en', 'es'];
 
export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
 
  // Ensure that a supported locale is used
  if (!locale || !locales.includes(locale as any)) {
    locale = 'en';
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
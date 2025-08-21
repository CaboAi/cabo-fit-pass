'use client'

import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'es' : 'en'
    
    startTransition(() => {
      // Set cookie and navigate to same path in new locale
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
      // Replace current locale in pathname and navigate
      const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
      router.replace(newPath)
    })
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="gap-2 text-text-secondary hover:text-text-primary"
      aria-label={locale === 'en' ? 'Switch to Spanish' : 'Cambiar a inglés'}
      disabled={isPending}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {locale === 'en' ? 'ES' : 'EN'}
      </span>
    </Button>
  )
}

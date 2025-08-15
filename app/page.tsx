'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Activity, Search, CalendarClock, Dumbbell, X, DollarSign, FileX, MapPin, Smartphone } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import { supabase } from '@/lib/supabase/client'

// Simple inline AuthDialog component
function AuthDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // Create profile record
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            user_type: 'member',
            credits: 5,
          },
        ])

        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
          aria-label={t.ariaCloseDialog}
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-4 text-text-primary">{t.authTitle}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            data-cta="signup-dialog"
          >
            {loading ? t.creatingAccount : t.createAccount}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const { t } = useLanguage()

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-gradient-to-r from-primary to-secondary text-white p-2 rounded-full">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <h1 className="text-xl font-bold gradient-fitness-text">
                Cabo Fit Pass
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Button
                onClick={() => setIsAuthDialogOpen(true)}
                className="btn-fitness-primary"
                data-cta="header-signup"
                aria-label={t.ariaSignUp}
              >
                {t.getStarted}
              </Button>
            </div>
          </div>
        </div>
        </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-background-secondary to-background-tertiary min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold gradient-fitness-text mb-8 leading-relaxed py-4">
            {t.heroTitle}
          </h2>
          
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            {t.heroSubtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => setIsAuthDialogOpen(true)}
              size="lg"
              className="btn-fitness-primary px-8 py-4 text-lg"
              data-cta="get-started"
              aria-label={t.ariaSignUp}
            >
              {t.getStarted}
            </Button>
            
            <Button
              onClick={() => scrollToSection('how-it-works')}
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
              data-cta="learn-more"
              aria-label={t.ariaLearnMore}
            >
              {t.learnMore}
              </Button>
          </div>
          
          {/* Trust Row */}
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-4">{t.trustText}</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-12 h-8 bg-text-tertiary/20 rounded flex items-center justify-center">
                  <span className="text-xs font-medium">GYM</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              {t.howItWorksTitle}
            </h3>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              {t.howItWorksSubtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: t.findTitle,
                description: t.findDescription
              },
              {
                icon: CalendarClock,
                title: t.bookTitle,
                description: t.bookDescription
              },
              {
                icon: Dumbbell,
                title: t.trainTitle,
                description: t.trainDescription
              }
            ].map((step, index) => (
              <Card key={index} className="card-fitness text-center bg-surface border-border">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-text-primary">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              {t.benefitsTitle}
            </h3>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: DollarSign,
                text: t.saveMoneyText
              },
              {
                icon: FileX,
                text: t.noContractsText
              },
              {
                icon: MapPin,
                text: t.discoverSpotsText
              },
              {
                icon: Smartphone,
                text: t.mobilePassText
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-medium text-text-primary">{benefit.text}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg text-text-secondary">
              {t.pricingText}
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              {t.testimonialsTitle}
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                quote: t.testimonial1,
                name: "Maria Rodriguez",
                role: t.role1
              },
              {
                quote: t.testimonial2,
                name: "Carlos Santos",
                role: t.role2
              }
            ].map((testimonial, index) => (
              <Card key={index} className="card-fitness bg-surface border-border">
                <CardContent className="pt-6">
                  <p className="text-text-secondary mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-gradient-to-r from-primary to-secondary" />
                    <div>
                      <p className="font-medium text-text-primary">{testimonial.name}</p>
                      <p className="text-sm text-text-tertiary">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Logo Strip */}
          <div className="text-center">
            <p className="text-sm text-text-tertiary mb-6">{t.featuredGymsText}</p>
            <div className="flex justify-center items-center gap-12 flex-wrap opacity-40">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-16 h-10 bg-text-tertiary/20 rounded flex items-center justify-center">
                  <span className="text-xs font-medium">STUDIO</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Access Section */}
      <section className="py-20 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            {t.demoTitle}
          </h3>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            {t.demoDescription}
          </p>
          
            <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
              data-cta="try-demo"
              aria-label={t.ariaTryDemo}
            >
              {t.tryDemo}
              </Button>
            </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.finalCtaTitle}
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t.finalCtaDescription}
          </p>
          
          <Button
            onClick={() => setIsAuthDialogOpen(true)}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold"
            data-cta="final-cta"
            aria-label={t.ariaFinalCta}
          >
            {t.getStartedToday}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold gradient-fitness-text">Cabo Fit Pass</span>
            </div>
            
            <div className="flex gap-6 text-sm text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">{t.terms}</a>
              <a href="#" className="hover:text-text-primary transition-colors">{t.privacy}</a>
              <a href="mailto:hello@cabofitpass.com" className="hover:text-text-primary transition-colors">
                {t.contact}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
    </div>
  )
}
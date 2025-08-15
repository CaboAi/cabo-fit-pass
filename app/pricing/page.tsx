'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NavigationHeader } from '@/components/layout/navigation-header'
import {
  CreditCard,
  Check,
  Star,
  Crown,
  Zap,
  Gift,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Phone,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Award,
  Infinity,
  Target,
  Heart,
  Activity
} from 'lucide-react'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonus?: number
  savings?: string
  popular?: boolean
  description: string
  features: string[]
  icon: React.ReactNode
  color: string
}

interface SubscriptionTier {
  id: string
  name: string
  price: number
  monthlyCredits: number
  description: string
  popular?: boolean
  features: string[]
  restrictions?: string[]
  icon: React.ReactNode
  color: string
  badge?: string
}

interface FAQ {
  question: string
  answer: string
}

// Credit Packages
const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    price: 25,
    bonus: 2,
    description: 'Perfect for trying out our platform',
    features: [
      '10 base credits + 2 bonus',
      'Valid for 6 months',
      'All studio access',
      'Mobile app included',
      'Email support'
    ],
    icon: <Zap className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 25,
    price: 50,
    bonus: 8,
    savings: 'Save 20%',
    popular: true,
    description: 'Most popular choice for regular users',
    features: [
      '25 base credits + 8 bonus',
      'Valid for 8 months',
      'All studio access',
      'Priority booking',
      'Mobile app included',
      'Priority support',
      'Class recommendations'
    ],
    icon: <Star className="w-8 h-8" />,
    color: 'from-orange-500 to-pink-500'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 50,
    price: 90,
    bonus: 20,
    savings: 'Save 35%',
    description: 'Maximum value for fitness enthusiasts',
    features: [
      '50 base credits + 20 bonus',
      'Valid for 12 months',
      'All studio access',
      'VIP booking privileges',
      'Mobile app included',
      'Premium support',
      'Personal trainer consultations',
      'Nutrition guidance',
      'Progress tracking'
    ],
    icon: <Crown className="w-8 h-8" />,
    color: 'from-purple-500 to-indigo-500'
  }
]

// Subscription Tiers
const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    monthlyCredits: 8,
    description: 'Great for casual fitness lovers',
    features: [
      '8 credits per month',
      'All studio access',
      'Mobile app',
      'Email support',
      'Basic progress tracking'
    ],
    restrictions: [
      'No rollover credits',
      'Standard booking window'
    ],
    icon: <Activity className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    monthlyCredits: 15,
    description: 'Perfect for regular fitness enthusiasts',
    popular: true,
    badge: 'Most Popular',
    features: [
      '15 credits per month',
      'All studio access',
      'Priority booking',
      'Mobile app',
      'Priority support',
      '2 guest passes per month',
      'Advanced progress tracking',
      'Class recommendations'
    ],
    restrictions: [
      'Credits rollover for 1 month'
    ],
    icon: <Target className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 89,
    monthlyCredits: 30,
    description: 'Ultimate fitness experience',
    features: [
      '30 credits per month',
      'All studio access',
      'VIP booking privileges',
      'Mobile app',
      'Concierge support',
      '5 guest passes per month',
      'Personal trainer consultations',
      'Nutrition guidance',
      'Advanced analytics',
      'Exclusive events access',
      'Partner discounts'
    ],
    restrictions: [
      'Credits rollover for 3 months'
    ],
    icon: <Crown className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    badge: 'Premium'
  }
]

// FAQ Data
const FAQ_DATA: FAQ[] = [
  {
    question: 'How do credits work?',
    answer: 'Each fitness class costs a certain number of credits based on the studio, instructor, and class type. Credits never expire and can be used at any of our partner studios throughout Los Cabos.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes! You can cancel your subscription at any time. Your current credits will remain valid, and you&apos;ll continue to have access until your billing period ends.'
  },
  {
    question: 'What happens if I don&apos;t use all my monthly credits?',
    answer: 'Subscription credits have different rollover policies: Basic (no rollover), Pro (1 month rollover), Elite (3 months rollover). One-time credit purchases never expire.'
  },
  {
    question: 'Are there any hidden fees?',
    answer: 'No hidden fees! The prices you see are exactly what you pay. Some premium studios may charge a small supplement, but this is clearly marked before booking.'
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Absolutely! You can change your subscription tier at any time. Upgrades take effect immediately, while downgrades take effect at your next billing cycle.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 7-day satisfaction guarantee for first-time subscribers. Credit packages are non-refundable but never expire, giving you flexibility to use them when convenient.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and local Mexican payment methods including OXXO and bank transfers.'
  },
  {
    question: 'Is there a family or group discount?',
    answer: 'Yes! We offer 15% off for families (2+ members) and 20% off for groups of 5 or more. Contact our support team to set up group billing.'
  }
]

export default function PricingPage() {
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null)
  const [pricingType, setPricingType] = useState<'credits' | 'subscription'>('credits')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const demoSession = localStorage.getItem('demo-session')
    const demoUser = localStorage.getItem('demo-user')
    setIsLoggedIn(!!demoSession)
    if (demoUser) {
      setProfile(JSON.parse(demoUser))
    }
  }, [])

  const handlePurchase = (type: 'credit' | 'subscription', id: string) => {
    if (!isLoggedIn) {
      router.push('/auth/signin')
      return
    }
    
    // For demo purposes, just show an alert
    if (type === 'credit') {
      const package_ = CREDIT_PACKAGES.find(p => p.id === id)
      alert(`Demo: Would purchase ${package_?.name} for $${package_?.price}`)
    } else {
      const subscription = SUBSCRIPTION_TIERS.find(s => s.id === id)
      alert(`Demo: Would subscribe to ${subscription?.name} for $${subscription?.price}/month`)
    }
  }

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  const handleSignOut = () => {
    localStorage.removeItem('demo-session')
    localStorage.removeItem('demo-user')
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
      <NavigationHeader profile={profile} onSignOut={handleSignOut} />
      {/* Header */}
      <div className="relative bg-surface/95 backdrop-blur-xl border-b border-border shadow-fitness-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 -z-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-3 text-text-secondary hover:text-text-primary transition-colors rounded-2xl hover:bg-surface-tertiary"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-fitness-primary rounded-full blur-xl opacity-75 -z-10"></div>
                <div className="relative gradient-fitness-primary text-primary-foreground p-4 rounded-2xl z-10">
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h1 className="font-heading text-display-lg gradient-fitness-text">
                  Pricing Plans
                </h1>
                <p className="text-text-secondary text-body-lg">Choose the perfect plan for your fitness journey</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-fitness-stats p-6 text-center animate-fade-in">
              <Shield className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-body-sm font-medium text-text-primary">Secure Payment</p>
              <p className="text-caption-sm text-text-secondary">SSL Protected</p>
            </div>
            <div className="card-fitness-stats p-6 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Award className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-body-sm font-medium text-text-primary">Money Back</p>
              <p className="text-caption-sm text-text-secondary">7-Day Guarantee</p>
            </div>
            <div className="card-fitness-stats p-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-body-sm font-medium text-text-primary">1000+ Members</p>
              <p className="text-caption-sm text-text-secondary">Growing Community</p>
            </div>
            <div className="card-fitness-stats p-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Phone className="w-8 h-8 text-accent-purple mx-auto mb-2" />
              <p className="text-body-sm font-medium text-text-primary">24/7 Support</p>
              <p className="text-caption-sm text-text-secondary">Always Here</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Pricing Toggle */}
        <div className="mb-12 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="inline-flex card-fitness p-2">
            <button
              onClick={() => setPricingType('credits')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                pricingType === 'credits'
                  ? 'btn-fitness-primary'
                  : 'btn-fitness-ghost'
              }`}
            >
              Credit Packages
            </button>
            <button
              onClick={() => setPricingType('subscription')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                pricingType === 'subscription'
                  ? 'btn-fitness-primary'
                  : 'btn-fitness-ghost'
              }`}
            >
              Monthly Plans
            </button>
          </div>
        </div>

        {/* Credit Packages */}
        {pricingType === 'credits' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="font-heading text-display-md text-text-primary mb-4">One-Time Credit Packages</h2>
              <p className="text-body-xl text-text-secondary max-w-2xl mx-auto">
                Purchase credits that never expire. Perfect for flexible fitness schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {CREDIT_PACKAGES.map((package_) => (
                <div
                  key={package_.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedPackage === package_.id ? 'scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => setSelectedPackage(package_.id)}
                >
                  {/* Popular Badge */}
                  {package_.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-orange-400 to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${package_.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>

                  <Card className={`relative bg-black/40 backdrop-blur-xl border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden ${
                    selectedPackage === package_.id ? 'border-purple-400 bg-gradient-to-br from-purple-600/20 to-pink-600/20' : ''
                  }`}>
                    <CardHeader className="text-center pb-6">
                      {/* Package Icon */}
                      <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${package_.color} text-white`}>
                          {package_.icon}
                        </div>
                      </div>

                      <CardTitle className="text-2xl font-bold text-white mb-2">
                        {package_.name}
                      </CardTitle>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-4xl font-bold text-white">{package_.credits}</span>
                          {package_.bonus && (
                            <span className="text-xl text-green-400 font-semibold">
                              +{package_.bonus}
                            </span>
                          )}
                          <span className="text-purple-300">credits</span>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                            ${package_.price}
                          </div>
                          {package_.savings && (
                            <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                              {package_.savings}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-purple-200 mt-4">{package_.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Features */}
                      <div className="space-y-3">
                        {package_.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="p-1 bg-green-500/20 rounded-full">
                              <Check className="w-3 h-3 text-green-400" />
                            </div>
                            <span className="text-purple-200 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bonus Credits Highlight */}
                      {package_.bonus && (
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <Gift className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-green-400 font-semibold">Bonus Credits!</p>
                              <p className="text-green-300 text-sm">
                                Get {package_.bonus} extra credits free - Total: {package_.credits + package_.bonus} credits
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePurchase('credit', package_.id)
                        }}
                        className="relative w-full group"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${package_.color} rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`relative bg-gradient-to-r ${package_.color} text-white py-4 px-6 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2`}>
                          <CreditCard className="w-5 h-5" />
                          Purchase Credits
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        {pricingType === 'subscription' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Monthly Subscription Plans</h2>
              <p className="text-xl text-purple-200 max-w-2xl mx-auto">
                Consistent fitness with monthly credits and exclusive benefits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedSubscription === tier.id ? 'scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => setSelectedSubscription(tier.id)}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-orange-400 to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        {tier.badge}
                      </div>
                    </div>
                  )}

                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${tier.color} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>

                  <Card className={`relative bg-black/40 backdrop-blur-xl border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden h-full ${
                    selectedSubscription === tier.id ? 'border-purple-400 bg-gradient-to-br from-purple-600/20 to-pink-600/20' : ''
                  }`}>
                    <CardHeader className="text-center pb-6">
                      {/* Tier Icon */}
                      <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-r ${tier.color} text-white`}>
                          {tier.icon}
                        </div>
                      </div>

                      <CardTitle className="text-2xl font-bold text-white mb-2">
                        {tier.name}
                      </CardTitle>
                      
                      <div className="space-y-2">
                        <div className="text-center">
                          <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
                            ${tier.price}
                          </div>
                          <div className="text-purple-300">/month</div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-white font-semibold text-lg">{tier.monthlyCredits} Credits</p>
                          <p className="text-purple-300 text-sm">Every month</p>
                        </div>
                      </div>

                      <p className="text-purple-200 mt-4">{tier.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-6 flex-1">
                      {/* Features */}
                      <div className="space-y-3">
                        <p className="text-white font-semibold text-sm">INCLUDED:</p>
                        {tier.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="p-1 bg-green-500/20 rounded-full mt-0.5">
                              <Check className="w-3 h-3 text-green-400" />
                            </div>
                            <span className="text-purple-200 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Restrictions */}
                      {tier.restrictions && tier.restrictions.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-purple-400 font-semibold text-sm">LIMITATIONS:</p>
                          {tier.restrictions.map((restriction, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="p-1 bg-orange-500/20 rounded-full mt-0.5">
                                <Clock className="w-3 h-3 text-orange-400" />
                              </div>
                              <span className="text-purple-300 text-sm">{restriction}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Value Highlight */}
                      {tier.id === 'elite' && (
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                          <div className="flex items-center gap-3">
                            <Infinity className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-purple-400 font-semibold">Premium Value</p>
                              <p className="text-purple-300 text-sm">
                                Just $2.97 per credit - our best value!
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CTA Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePurchase('subscription', tier.id)
                        }}
                        className="relative w-full group mt-auto"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${tier.color} rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                        <div className={`relative bg-gradient-to-r ${tier.color} text-white py-4 px-6 rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2`}>
                          <Calendar className="w-5 h-5" />
                          Start Subscription
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Subscription Benefits */}
            <div className="mt-16">
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <Heart className="w-6 h-6 text-pink-400" />
                    Why Choose a Subscription?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center space-y-3">
                      <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/20 inline-block">
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Better Value</h3>
                      <p className="text-purple-300 text-sm">
                        Save up to 40% compared to individual credit purchases with consistent monthly benefits.
                      </p>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/20 inline-block">
                        <Calendar className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Consistent Fitness</h3>
                      <p className="text-purple-300 text-sm">
                        Fresh credits every month encourage regular fitness habits and help you stay on track.
                      </p>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20 inline-block">
                        <Crown className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Exclusive Perks</h3>
                      <p className="text-purple-300 text-sm">
                        Priority booking, guest passes, personal consultations, and member-only events.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-purple-200">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-8">
              <div className="space-y-4">
                {FAQ_DATA.map((faq, index) => (
                  <div key={index} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-6 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                    >
                      <span className="text-white font-semibold">{faq.question}</span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                    
                    {expandedFAQ === index && (
                      <div className="px-6 pb-6">
                        <p className="text-purple-200 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Final CTA Section */}
        <div className="mt-20 text-center">
          <div className="relative group">
            <div className="absolute inset-0 gradient-fitness-primary rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity -z-10"></div>
            <Card className="relative card-fitness-elevated bg-surface overflow-hidden z-10">
              <CardContent className="p-12">
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 gradient-fitness-primary rounded-full blur-lg opacity-75 -z-10"></div>
                      <div className="relative gradient-fitness-primary p-4 rounded-full z-10">
                        <Sparkles className="w-12 h-12 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="font-heading text-display-lg text-text-primary mb-4">
                      Ready to Start Your Fitness Journey?
                    </h2>
                    <p className="text-body-xl text-text-secondary max-w-2xl mx-auto">
                      Join over 1,000 members already transforming their lives with Cabo Fit Pass.
                      Your perfect fitness plan is just one click away.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => !isLoggedIn ? router.push('/auth/signin') : handlePurchase('credit', 'popular')}
                      className="btn-fitness-primary py-4 px-8 text-lg flex items-center gap-3"
                    >
                      <Star className="w-5 h-5" />
                      Get Popular Pack
                    </button>
                    
                    <button
                      onClick={() => !isLoggedIn ? router.push('/auth/signin') : handlePurchase('subscription', 'pro')}
                      className="btn-fitness-secondary py-4 px-8 text-lg flex items-center gap-3"
                    >
                      <Crown className="w-5 h-5" />
                      Try Pro Monthly
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-body-sm">Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <span className="text-body-sm">7-day guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-info rounded-full"></div>
                      <span className="text-body-sm">24/7 support</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Database, CreditCard, Mail, Cookie } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-700 mt-4 leading-relaxed">
            At Cabo Fit Pass, we take your privacy seriously. This policy describes how we collect, 
            use, and protect your personal information when you use our fitness booking platform.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and email address (for account creation)</li>
                    <li>Payment information (processed securely via Stripe)</li>
                    <li>Phone number (optional, for booking confirmations)</li>
                    <li>Emergency contact information (optional)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Usage Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Class booking history and preferences</li>
                    <li>Credit purchase and usage patterns</li>
                    <li>Login times and app usage analytics</li>
                    <li>Device information and IP address</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                2. Data Storage (Supabase)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  Your data is securely stored using Supabase, a trusted database platform that provides:
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Row Level Security (RLS):</strong> Your data is only accessible to you and authorized systems</li>
                    <li><strong>Encryption:</strong> All data is encrypted both in transit and at rest</li>
                    <li><strong>Regular Backups:</strong> Automated daily backups ensure data recovery</li>
                    <li><strong>Compliance:</strong> SOC 2 Type II certified infrastructure</li>
                    <li><strong>Geographic Security:</strong> Data stored in secure, monitored facilities</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  We implement additional security measures including access logging, 
                  API rate limiting, and regular security audits.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                3. Payment Processing (Stripe)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  All payments are processed through Stripe, Inc., a PCI DSS compliant payment processor:
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>No Card Storage:</strong> We never store your complete credit card information</li>
                    <li><strong>Tokenization:</strong> Card details are replaced with secure tokens</li>
                    <li><strong>Industry Standards:</strong> PCI DSS Level 1 compliance</li>
                    <li><strong>Fraud Protection:</strong> Advanced fraud detection and prevention</li>
                    <li><strong>International Security:</strong> Meets global security standards</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  Stripe may share necessary transaction data for payment processing, 
                  fraud prevention, and regulatory compliance.
                </p>
                <div className="mt-3">
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Data We Access:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Last 4 digits of card numbers (for display purposes)</li>
                    <li>Payment method type (Visa, Mastercard, etc.)</li>
                    <li>Transaction amounts and dates</li>
                    <li>Billing country and currency</li>
                    <li>Payment success/failure status</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                4. Email Communications (SendGrid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  We use SendGrid for reliable email delivery. Your email preferences and communications include:
                </p>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Transactional Emails (Required)</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Booking confirmations and class reminders</li>
                        <li>Payment receipts and subscription updates</li>
                        <li>Account security notifications</li>
                        <li>Password reset and login verification</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Marketing Emails (Optional)</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>New gym partnerships and class offerings</li>
                        <li>Special promotions and discounts</li>
                        <li>Fitness tips and community updates</li>
                        <li>Monthly newsletters and announcements</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Your Control:</strong> You can unsubscribe from marketing emails at any time. 
                    Transactional emails are necessary for service operation and cannot be disabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-purple-600" />
                5. Cookies and Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>We use cookies and similar technologies to enhance your experience:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Authentication and login sessions</li>
                      <li>Shopping cart and booking state</li>
                      <li>Security and fraud prevention</li>
                      <li>Language and region preferences</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Website usage and performance metrics</li>
                      <li>Popular classes and features</li>
                      <li>Error tracking and improvements</li>
                      <li>A/B testing for user experience</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  You can control cookie preferences through your browser settings. 
                  Disabling essential cookies may affect website functionality.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>We use your personal information to:</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Service Operations</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Process bookings and manage your schedule</li>
                      <li>Handle payments and subscription billing</li>
                      <li>Send important service notifications</li>
                      <li>Provide customer support</li>
                      <li>Maintain account security</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Service Improvements</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Analyze usage patterns and preferences</li>
                      <li>Develop new features and services</li>
                      <li>Improve website performance</li>
                      <li>Personalize your experience</li>
                      <li>Prevent fraud and abuse</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Data Sharing and Third Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>We share your information only when necessary:</p>
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <h4 className="font-semibold text-red-900 mb-2">We NEVER sell your personal data</h4>
                    <p className="text-red-800 text-sm">
                      Your information is never sold to advertisers, marketers, or data brokers.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Limited Sharing Occurs With:</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Partner Gyms:</strong> Booking details needed for class check-ins</li>
                      <li><strong>Service Providers:</strong> Stripe (payments), SendGrid (emails), Supabase (storage)</li>
                      <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                      <li><strong>Business Transfers:</strong> In the event of merger or acquisition</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>You have the following rights regarding your personal data:</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update incorrect or incomplete information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Portability:</strong> Export your data in a readable format</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                    <li><strong>Restriction:</strong> Limit how we process your data</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  To exercise these rights, contact us at privacy@cabofitpass.com. 
                  We'll respond within 30 days of your request.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>We retain your information as follows:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Active Accounts:</strong> While your account remains active</li>
                  <li><strong>Inactive Accounts:</strong> 3 years after last login</li>
                  <li><strong>Payment Records:</strong> 7 years for tax and legal compliance</li>
                  <li><strong>Marketing Data:</strong> Until you opt out or request deletion</li>
                  <li><strong>Support Records:</strong> 2 years after case closure</li>
                </ul>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  Some information may be retained longer if required by law or for legitimate business purposes 
                  such as fraud prevention or dispute resolution.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  As a service operating in Los Cabos, Mexico with international technology partners, 
                  your data may be transferred to and processed in:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>United States:</strong> Stripe (payments), SendGrid (emails)</li>
                  <li><strong>Various Locations:</strong> Supabase cloud infrastructure</li>
                  <li><strong>Mexico:</strong> Our primary operations and support</li>
                </ul>
                <p className="text-sm text-gray-600">
                  All transfers are protected by appropriate safeguards including contractual protections 
                  and compliance with international data protection standards.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-4">
                  If you have questions about this Privacy Policy or our data practices, contact us:
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <p><strong>Privacy Officer</strong></p>
                    <p><strong>Email:</strong> privacy@cabofitpass.com</p>
                    <p><strong>General Support:</strong> support@cabofitpass.com</p>
                    <p><strong>Address:</strong> Los Cabos, Baja California Sur, Mexico</p>
                    <p><strong>Response Time:</strong> Within 48 hours for privacy inquiries</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Policy Updates</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            We may update this Privacy Policy from time to time. We'll notify you of significant changes 
            by email and through our platform. Your continued use of Cabo Fit Pass after changes 
            constitute acceptance of the updated policy.
          </p>
        </div>
      </div>
    </div>
  )
}
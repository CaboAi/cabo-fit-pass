'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Cabo Fit Pass ("Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Service Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  Cabo Fit Pass provides a fitness class booking platform that allows users to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Purchase subscription plans and credit packages</li>
                  <li>Book fitness classes at partner gyms and studios in Los Cabos</li>
                  <li>Manage their fitness schedule and credit balance</li>
                  <li>Access exclusive fitness content and community features</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Payment Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  All payments are processed securely through Stripe, Inc. ("Stripe"). By making a payment, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide accurate and complete payment information</li>
                  <li>Stripe's Terms of Service and Privacy Policy</li>
                  <li>Monthly subscription billing on the 28th of each month</li>
                  <li>Credit packages are non-refundable but do not expire</li>
                  <li>Subscription cancellation takes effect at the end of the current billing cycle</li>
                </ul>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Note:</strong> All payments are processed in USD. Local taxes may apply based on your location.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Credit System and Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>Our credit-based booking system operates under the following terms:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Credits are required to book fitness classes</li>
                  <li>Different classes may require different credit amounts</li>
                  <li>Credits do not expire but are tied to your active account</li>
                  <li>Class cancellations must be made 24 hours in advance for credit refund</li>
                  <li>No-shows will result in credit deduction without refund</li>
                  <li>Maximum class capacity is enforced by individual gym partners</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Storage and Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  Your account data is securely stored using Supabase infrastructure with the following protections:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Regular automated backups</li>
                  <li>Row Level Security (RLS) database policies</li>
                  <li>SOC 2 Type II compliant infrastructure</li>
                  <li>Data residency in secure cloud facilities</li>
                </ul>
                <p className="text-sm text-gray-600">
                  We store only necessary information for service provision and never sell your personal data to third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Email Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  Email communications are delivered through SendGrid and include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Booking confirmations and class reminders</li>
                  <li>Payment receipts and billing notifications</li>
                  <li>Account updates and security alerts</li>
                  <li>Promotional offers (with opt-out available)</li>
                </ul>
                <p className="text-sm text-gray-600">
                  You can unsubscribe from promotional emails at any time, but transactional emails 
                  (bookings, payments) are required for service operation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>As a user of Cabo Fit Pass, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide accurate and up-to-date account information</li>
                  <li>Arrive on time for booked classes and follow gym policies</li>
                  <li>Respect gym equipment, facilities, and other members</li>
                  <li>Not share your account credentials with others</li>
                  <li>Notify us immediately of any unauthorized account access</li>
                  <li>Comply with individual gym health and safety requirements</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Liability and Disclaimers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>
                  Cabo Fit Pass acts as a platform connecting users with fitness providers. We are not liable for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Injuries occurring during fitness activities</li>
                  <li>Gym closures, schedule changes, or cancellations</li>
                  <li>Quality of instruction or facilities at partner gyms</li>
                  <li>Personal property loss or damage at gym facilities</li>
                </ul>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  <strong>Important:</strong> Consult your physician before beginning any fitness program. 
                  Exercise at your own risk and within your physical limitations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed space-y-3">
                <p>Either party may terminate this agreement:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You may cancel your subscription at any time through your account settings</li>
                  <li>We may suspend accounts for violation of terms or fraudulent activity</li>
                  <li>Termination does not affect already-paid subscription periods</li>
                  <li>Unused credits remain available during your current billing cycle</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 leading-relaxed">
                <p>For questions regarding these Terms of Service, contact us at:</p>
                <div className="mt-3 p-4 bg-blue-50 rounded">
                  <p><strong>Email:</strong> support@cabofitpass.com</p>
                  <p><strong>Address:</strong> Los Cabos, Baja California Sur, Mexico</p>
                  <p><strong>Response Time:</strong> Within 48 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            These terms are effective as of the last updated date and supersede all previous agreements.
          </p>
        </div>
      </div>
    </div>
  )
}
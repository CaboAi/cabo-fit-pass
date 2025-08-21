import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { grantMonthlyCredits, getUserTier, getActiveCredits } from '@/utils/credits'
import { TIER_MONTHLY } from '@/lib/billing'
import { headers } from 'next/headers'

// This endpoint should be called by a cron job on day 28 of each month
// Protected by a secret header for security

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const cronSecret = headers().get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if today is day 28 (UTC)
    const today = new Date()
    const dayOfMonth = today.getUTCDate()

    if (dayOfMonth !== 28 && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { 
          success: true, 
          message: `Skipping - today is day ${dayOfMonth}, not day 28` 
        },
        { status: 204 }
      )
    }

    const supabase = createClient()

    // Get all active subscribers
    // In production, this would query Stripe subscriptions or a subscriptions table
    // For now, we'll grant to all users with tier > t1
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, tier')
      .in('tier', ['t2', 't3']) // Only premium and unlimited tiers get monthly credits
      .eq('frozen', false) // Skip frozen accounts

    if (usersError) {
      console.error('Failed to fetch active users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch active users' },
        { status: 500 }
      )
    }

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscribers to process',
        processed: 0
      })
    }

    // Process each user
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const user of activeUsers) {
      try {
        const tier = await getUserTier(user.id)
        
        // Get before balance
        const creditsBefore = await getActiveCredits(user.id)
        
        // Grant monthly credits
        await grantMonthlyCredits(user.id, tier)
        
        // Get after balance
        const creditsAfter = await getActiveCredits(user.id)
        const creditsGranted = creditsAfter - creditsBefore
        
        // Log to audit table
        const { error: auditError } = await supabase
          .from('credit_audit_log')
          .insert({
            user_id: user.id,
            action: 'monthly_grant',
            credits_before: creditsBefore,
            credits_after: creditsAfter,
            credits_changed: creditsGranted,
            metadata: {
              tier,
              grant_date: today.toISOString(),
              day_of_month: dayOfMonth,
              expected_grant: TIER_MONTHLY[tier]
            }
          })

        if (auditError) {
          console.error(`Failed to create audit log for user ${user.id}:`, auditError)
        }

        results.succeeded++
        console.log(`Granted ${creditsGranted} credits to user ${user.id} (${user.email}) - tier ${tier}`)
      } catch (error) {
        console.error(`Failed to grant credits to user ${user.id}:`, error)
        results.failed++
        results.errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      results.processed++
    }

    // Send summary notification (could be email, Slack, etc.)
    if (results.failed > 0) {
      console.error('Monthly grant completed with errors:', results)
    } else {
      console.log('Monthly grant completed successfully:', results)
    }

    return NextResponse.json({
      success: true,
      message: `Monthly credit grant completed for day ${dayOfMonth}`,
      results
    })

  } catch (error) {
    console.error('Monthly grant job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking job status (useful for monitoring)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const cronSecret = headers().get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date()
    const dayOfMonth = today.getUTCDate()

    const supabase = createClient()

    // Get count of users that would be processed
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('tier', ['t2', 't3'])
      .eq('frozen', false)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to count eligible users' },
        { status: 500 }
      )
    }

    // Check last run from audit log
    const { data: lastRun } = await supabase
      .from('credit_audit_log')
      .select('created_at, metadata')
      .eq('action', 'monthly_grant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      status: {
        currentDay: dayOfMonth,
        scheduledDay: 28,
        willRunToday: dayOfMonth === 28,
        eligibleUsers: count || 0,
        lastRun: lastRun ? {
          date: lastRun.created_at,
          metadata: lastRun.metadata
        } : null
      }
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job or admin request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Calculate payout period (last 14 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14)
    
    // Get all unpaid ledger rows for the period
    const { data: unpaidLedger, error: ledgerError } = await supabase
      .from('credit_ledger')
      .select(`
        *,
        gyms!inner(stripe_connect_id, name)
      `)
      .eq('payout_status', 'pending')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('gyms.stripe_connect_id', 'is', null)

    if (ledgerError) {
      console.error('Error fetching unpaid ledger:', ledgerError)
      return NextResponse.json({ error: 'Failed to fetch ledger data' }, { status: 500 })
    }

    // Group by gym and calculate totals
    const gymPayouts = new Map<string, {
      gymId: string
      gymName: string
      stripeConnectId: string
      ledgerRows: any[]
      totalPayableCents: number
      amountCents: number
    }>()

    unpaidLedger?.forEach(row => {
      const gymId = row.gym_id
      if (!gymPayouts.has(gymId)) {
        gymPayouts.set(gymId, {
          gymId,
          gymName: row.gyms.name,
          stripeConnectId: row.gyms.stripe_connect_id,
          ledgerRows: [],
          totalPayableCents: 0,
          amountCents: 0
        })
      }
      
      const payout = gymPayouts.get(gymId)!
      payout.ledgerRows.push(row)
      payout.totalPayableCents += row.payable_to_gym_cents || 0
    })

    // Calculate 70% of payable amounts
    for (const payout of Array.from(gymPayouts.values())) {
      payout.amountCents = Math.round(payout.totalPayableCents * 0.7)
    }

    // Process payouts for each gym
    const results = []
    for (const payout of Array.from(gymPayouts.values())) {
      if (payout.amountCents <= 0) continue

      try {
        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: payout.amountCents,
          currency: 'usd',
          destination: payout.stripeConnectId,
          description: `Payout for ${payout.gymName} - ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          metadata: {
            gym_id: payout.gymId,
            period_start: startDate.toISOString(),
            period_end: endDate.toISOString(),
            total_payable: payout.totalPayableCents,
            amount_transferred: payout.amountCents
          }
        })

        // Create gym_payouts record
        const { data: payoutRecord, error: payoutError } = await supabase
          .from('gym_payouts')
          .insert({
            gym_id: payout.gymId,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
            total_credits_consumed: payout.ledgerRows.length,
            total_payable_cents: payout.totalPayableCents,
            stripe_payout_id: transfer.id,
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (payoutError) {
          console.error('Error creating payout record:', payoutError)
          continue
        }

        // Mark ledger rows as transferred
        const ledgerIds = payout.ledgerRows.map((row: any) => row.id)
        await supabase
          .from('credit_ledger')
          .update({
            payout_status: 'transferred',
            payout_id: payoutRecord.id
          })
          .in('id', ledgerIds)

        results.push({
          gym: payout.gymName,
          amount: payout.amountCents / 100,
          transferId: transfer.id,
          status: 'success'
        })

      } catch (error) {
        console.error(`Error processing payout for ${payout.gymName}:`, error)
        
        // Mark payout as failed
        await supabase
          .from('gym_payouts')
          .insert({
            gym_id: payout.gymId,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
            total_credits_consumed: payout.ledgerRows.length,
            total_payable_cents: payout.totalPayableCents,
            status: 'failed',
            processed_at: new Date().toISOString()
          })

        results.push({
          gym: payout.gymName,
          amount: payout.amountCents / 100,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      results,
      summary: {
        totalGyms: gymPayouts.size,
        successfulPayouts: results.filter(r => r.status === 'success').length,
        failedPayouts: results.filter(r => r.status === 'failed').length,
        totalAmount: results
          .filter(r => r.status === 'success')
          .reduce((sum, r) => sum + r.amount, 0)
      }
    })

  } catch (error) {
    console.error('Payout processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

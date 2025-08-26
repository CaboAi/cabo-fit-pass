import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type BookingRow = {
id: string
credits_used: number | null
attended: boolean
booking_date: string | null
classes: {
id: string
title: string | null
start_time: string | null
price: number | null
gym_id: string | null
studios: { id: string; name: string | null } | null
} | null
}

const GYM_PAYOUT = { percentage: 0.7, base_price: 15 }

export async function POST(req: NextRequest) {
try {
const supabase = createClient()

const { start, end } = await req.json()
const startDate = start ? new Date(start) : new Date(Date.now() - 13 * 24 * 3600 * 1000)
const endDate = end ? new Date(end) : new Date()

// pricing map keyed by gym_id
const { data: pricingRows } = await supabase
  .from("gym_pricing")
  .select("gym_id, drop_in_rate")
const pricingMap = new Map<string, { payout_percentage: number; base_price: number }>()
for (const r of pricingRows || []) {
  if (!r?.gym_id) continue
  pricingMap.set(r.gym_id, {
    payout_percentage: GYM_PAYOUT.percentage,
    base_price: Number(r.drop_in_rate ?? GYM_PAYOUT.base_price),
  })
}

// load attended bookings in window with class and studio info
const { data: bookingRows, error: bookingsError } = await supabase
  .from("bookings")
  .select(`
    id,
    credits_used,
    attended,
    booking_date,
    classes (
      id,
      title,
      start_time,
      price,
      gym_id,
      studios (
        id,
        name
      )
    )
  `)
  .eq("attended", true)
  .in("booking_status", ["confirmed", "completed"])
  .gte("classes.start_time", startDate.toISOString())
  .lte("classes.start_time", endDate.toISOString())

if (bookingsError) throw bookingsError
const bookings: BookingRow[] = (bookingRows as unknown as BookingRow[]) ?? []

// aggregate by gym and class day
const gymPayouts = new Map<
  string,
  {
    gym_id: string
    gym_name: string
    total_classes: number
    total_attended: number
    total_revenue: number
    payout_amount: number
    details: Array<{
      class_id: string
      class_name: string
      class_date: string
      attendees: number
      revenue: number
      payout: number
    }>
  }
>()

for (const booking of bookings) {
  const cls = booking.classes
  if (!cls) continue

  const gymId = cls.gym_id ?? "unknown"
  const gymName = cls.studios?.name ?? "Unknown gym"

  const pricing = pricingMap.get(gymId) ?? {
    payout_percentage: GYM_PAYOUT.percentage,
    base_price: GYM_PAYOUT.base_price,
  }

  const classPrice = Number(cls.price ?? pricing.base_price)
  const payoutAmount = classPrice * pricing.payout_percentage

  if (!gymPayouts.has(gymId)) {
    gymPayouts.set(gymId, {
      gym_id: gymId,
      gym_name: gymName,
      total_classes: 0,
      total_attended: 0,
      total_revenue: 0,
      payout_amount: 0,
      details: [],
    })
  }
  const gymPayout = gymPayouts.get(gymId)!

  const classDate = (cls.start_time ?? "").split("T")[0]
  let classDetail = gymPayout.details.find(d => d.class_id === cls.id && d.class_date === classDate)
  if (!classDetail) {
    classDetail = {
      class_id: cls.id,
      class_name: cls.title ?? "Class",
      class_date: classDate,
      attendees: 0,
      revenue: 0,
      payout: 0,
    }
    gymPayout.details.push(classDetail)
    gymPayout.total_classes++
  }

  classDetail.attendees++
  classDetail.revenue += classPrice
  classDetail.payout += payoutAmount

  gymPayout.total_attended++
  gymPayout.total_revenue += classPrice
  gymPayout.payout_amount += payoutAmount
}

const result = Array.from(gymPayouts.values())

// store snapshot
const snapshot = {
  window_start: startDate.toISOString().slice(0, 10),
  window_end: endDate.toISOString().slice(0, 10),
  payable: result,
}

await supabase.rpc("ensure_payouts_table") // no-op if you do not have it; ignore failure
await supabase.from("payables_snapshots").insert({
  window_start: snapshot.window_start,
  window_end: snapshot.window_end,
  payable: result as unknown as object,
})

return NextResponse.json({ ok: true, start: snapshot.window_start, end: snapshot.window_end, gyms: result.length, data: result })

} catch (err: any) {
return NextResponse.json({ ok: false, error: err?.message ?? "payouts failed" }, { status: 500 })
}
}

export async function GET() {
const supabase = createClient()
const { data } = await supabase
.from("payables_snapshots")
.select("*")
.order("created_at", { ascending: false })
.limit(20)
return NextResponse.json({ ok: true, snapshots: data ?? [] })
}

export async function PUT() {
// convenience: generate the last 14 days window
const end = new Date()
const start = new Date(Date.now() - 13 * 24 * 3600 * 1000)
const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/reports/payouts` : "http://localhost:3000/api/reports/payouts", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() }),
cache: "no-store",
})
const json = await res.json()
return NextResponse.json(json, { status: res.ok ? 200 : 500 })
}
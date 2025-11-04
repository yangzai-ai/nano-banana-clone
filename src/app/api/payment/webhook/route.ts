import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    console.log('\n========== WEBHOOK RECEIVED ==========')
    console.log('[Webhook] Timestamp:', new Date().toISOString())
    console.log('[Webhook] Headers:', Object.fromEntries(req.headers.entries()))

    const signature = req.headers.get('creem-signature')
    const body = await req.text()

    console.log('[Webhook] Raw body:', body)
    console.log('[Webhook] Signature:', signature)

    if (!signature) {
      console.error('[Webhook] ERROR: No signature provided')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    // Note: Replace this with actual Creem signature verification when available
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Webhook] ERROR: CREEM_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    console.log('[Webhook] Webhook secret configured:', webhookSecret.substring(0, 10) + '...')

    // TODO: Implement proper signature verification based on Creem's documentation
    // Example (adjust based on Creem's actual implementation):
    // const isValid = verifySignature(body, signature, webhookSecret)
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const event = JSON.parse(body)
    console.log('[Webhook] Event parsed:', JSON.stringify(event, null, 2))

    // Creem uses 'eventType' field (not 'type')
    const eventType = event.eventType || event.type
    console.log('[Webhook] Event type:', eventType)

    // Creem event data is in 'object' field (not 'data')
    const eventData = event.object || event.data

    // Handle different webhook events
    switch (eventType) {
      case 'checkout.completed':
      case 'checkout.session.completed':
        console.log('[Webhook] Handling checkout.completed')
        await handleCheckoutCompleted(eventData)
        break
      case 'payment.succeeded':
        console.log('[Webhook] Handling payment.succeeded')
        await handlePaymentSucceeded(eventData)
        break
      case 'subscription.created':
        console.log('[Webhook] Handling subscription.created')
        await handleSubscriptionCreated(eventData)
        break
      case 'subscription.updated':
        console.log('[Webhook] Handling subscription.updated')
        await handleSubscriptionUpdated(eventData)
        break
      case 'subscription.cancelled':
        console.log('[Webhook] Handling subscription.cancelled')
        await handleSubscriptionCancelled(eventData)
        break
      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`)
    }

    console.log('[Webhook] Returning success response')
    console.log('========== WEBHOOK COMPLETED ==========\n')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutCompleted(data: any) {
  // Use Admin Client to bypass RLS - webhooks have no user session
  const supabase = createAdminClient()

  try {
    console.log('[Webhook] Processing checkout.completed:', JSON.stringify(data, null, 2))

    // Extract data from Creem webhook
    // Creem structure: data contains checkout object with metadata, order, product
    const userId = data.metadata?.user_id
    const planType = data.metadata?.plan_type // 'monthly' or 'annual'
    const productId = data.product?.id || data.order?.product
    const amount = (data.order?.amount || data.product?.price || 0) / 100 // Convert cents to dollars
    const currency = data.order?.currency || data.product?.currency || 'USD'

    if (!userId) {
      console.error('[Webhook] No user_id in metadata. Full data:', JSON.stringify(data, null, 2))
      return
    }

    if (!productId) {
      console.error('[Webhook] No product_id found. Full data:', JSON.stringify(data, null, 2))
      return
    }

    console.log('[Webhook] Extracted data:', {
      userId,
      planType,
      productId,
      amount,
      currency
    })

    // Determine plan details from product_id or metadata
    let planName = 'pro' // Default
    let creditsTotal = 800 // Default for pro monthly

    // Map product_id to plan details (update these based on your actual product IDs)
    if (productId.includes('basic')) {
      planName = 'basic'
      creditsTotal = planType === 'annual' ? 1800 : 150
    } else if (productId.includes('pro')) {
      planName = 'pro'
      creditsTotal = planType === 'annual' ? 9600 : 800
    } else if (productId.includes('max')) {
      planName = 'max'
      creditsTotal = planType === 'annual' ? 55200 : 4600
    }

    console.log('[Webhook] Plan details:', { planName, creditsTotal })

    // Calculate period dates
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    if (planType === 'annual') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    console.log('[Webhook] Period:', {
      start: currentPeriodStart.toISOString(),
      end: currentPeriodEnd.toISOString()
    })

    // Prepare subscription data
    const subscriptionData = {
      user_id: userId,
      creem_subscription_id: data.id, // Checkout ID
      creem_customer_id: data.customer?.id || data.order?.customer,
      creem_checkout_id: data.id,
      plan_name: planName,
      plan_type: planType,
      product_id: productId,
      amount: amount,
      currency: currency,
      status: 'active',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: false,
      credits_total: creditsTotal,
      credits_used: 0,
      metadata: data.metadata || {},
    }

    console.log('[Webhook] Attempting to upsert subscription:', subscriptionData)

    // First, check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      // Mark old subscription as replaced
      console.log('[Webhook] Marking old subscription as replaced:', existingSubscription.id)
      await supabase
        .from('subscriptions')
        .update({
          status: 'replaced',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)
    }

    // Always create a new subscription
    console.log('[Webhook] Creating new subscription')
    const { data: insertedData, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()

    if (error) {
      console.error('[Webhook] Error creating subscription:', error)
    } else {
      console.log('[Webhook] Subscription created successfully:', insertedData)
    }
  } catch (error) {
    console.error('[Webhook] Error in handleCheckoutCompleted:', error)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentSucceeded(data: any) {
  // Handle successful payment
  console.log('Payment succeeded:', data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(data: any) {
  // Handle subscription creation
  console.log('Subscription created:', data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(data: any) {
  // Handle subscription update
  console.log('Subscription updated:', data)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCancelled(data: any) {
  const supabase = createAdminClient()

  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
    })
    .eq('user_id', data.metadata.user_id)

  if (error) {
    console.error('Error cancelling subscription:', error)
  }
}

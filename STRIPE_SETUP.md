# Stripe Integration Guide for GitOn

This guide will help you set up Stripe for subscription billing in GitOn.

## 🎯 Overview

GitOn uses a two-tier subscription model:
- **Free Plan**: 10 repository generations
- **Pro Plan**: Unlimited generations at $19.99/month

## 📋 Prerequisites

1. A Stripe account ([sign up here](https://dashboard.stripe.com/register))
2. Clerk account (already configured)
3. Node.js backend or serverless functions

## 🔧 Stripe Dashboard Setup

### Step 1: Create Products

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click "Add Product"

**GitOn Pro - Monthly**
- Name: `GitOn Pro`
- Description: `Unlimited repository analysis and advanced features`
- Pricing Model: `Recurring`
- Price: `$19.99 USD`
- Billing Period: `Monthly`
- Save the **Price ID** (starts with `price_`)

**GitOn Pro - Yearly (Optional)**
- Name: `GitOn Pro - Annual`
- Description: `Unlimited repository analysis and advanced features (Save 17%)`
- Pricing Model: `Recurring`
- Price: `$199.99 USD`
- Billing Period: `Yearly`
- Save the **Price ID**

### Step 2: Get API Keys

1. Go to [Developers → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Webhooks

1. Go to [Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add Endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Secret** (starts with `whsec_`)

## 💻 Backend Implementation

### Environment Variables

Add to your `.env.local`:

```env
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Clerk (already configured)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### Create Checkout Session API

Create `app/api/create-checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Create Webhook Handler

Create `app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        
        if (userId) {
          // Update user to Pro plan in your database
          await updateUserPlan(userId, 'pro');
          
          // Store subscription ID
          await storeSubscription(userId, session.subscription as string);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (subscription.status === 'active') {
          await updateUserPlan(userId, 'pro');
        } else if (['canceled', 'unpaid', 'past_due'].includes(subscription.status)) {
          await updateUserPlan(userId, 'free');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        await updateUserPlan(userId, 'free');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Send email notification to user
        console.log('Payment failed for invoice:', invoice.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Helper functions - implement based on your database
async function updateUserPlan(userId: string, plan: 'free' | 'pro') {
  // Update in Clerk metadata
  const { clerkClient } = await import('@clerk/nextjs/server');
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { plan },
  });
}

async function storeSubscription(userId: string, subscriptionId: string) {
  // Store in your database or Clerk metadata
  const { clerkClient } = await import('@clerk/nextjs/server');
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: { stripeSubscriptionId: subscriptionId },
  });
}
```

### Frontend Checkout Integration

Update `components/SettingsPage.tsx` upgrade button:

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const handleUpgrade = async () => {
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
      }),
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    
    if (stripe) {
      await stripe.redirectToCheckout({ sessionId });
    }
  } catch (error) {
    console.error('Checkout error:', error);
  }
};

// Update button
<button 
  onClick={handleUpgrade}
  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
>
  Upgrade to Pro
</button>
```

## 🔄 Sync Plan with Clerk

Update your app to read plan from Clerk metadata:

```typescript
import { useUser } from '@clerk/clerk-react';

function App() {
  const { user } = useUser();
  const userPlan = user?.publicMetadata?.plan as 'free' | 'pro' || 'free';
  
  // Use userPlan throughout your app
}
```

## 📊 Customer Portal

Allow users to manage subscriptions:

```typescript
// app/api/create-portal-session/route.ts
export async function POST(req: NextRequest) {
  const { userId } = auth();
  const { user } = await clerkClient.users.getUser(userId!);
  const customerId = user.privateMetadata.stripeCustomerId as string;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

## ✅ Testing

### Test Mode
1. Use test API keys (pk_test_, sk_test_)
2. Test cards: [Stripe Test Cards](https://stripe.com/docs/testing)
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Webhook Testing
```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🚀 Go Live

1. Switch to live API keys in production
2. Update webhook endpoint to production URL
3. Test with real payment (then refund)
4. Monitor [Stripe Dashboard](https://dashboard.stripe.com)

## 📝 Checklist

- [ ] Stripe account created
- [ ] Products created in Stripe
- [ ] API keys added to environment variables
- [ ] Webhook endpoint configured
- [ ] Checkout API implemented
- [ ] Webhook handler implemented
- [ ] Frontend integrated with Stripe
- [ ] Plan synced with Clerk metadata
- [ ] Customer portal configured
- [ ] Tested in test mode
- [ ] Ready for production

## 🆘 Support

- [Stripe Documentation](https://stripe.com/docs)
- [Clerk + Stripe Guide](https://clerk.com/docs/integrations/stripe)
- [Stripe Support](https://support.stripe.com)

---

**Note**: This is a production-ready setup. Make sure to handle errors gracefully and add proper logging for debugging.

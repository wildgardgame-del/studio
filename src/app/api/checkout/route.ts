
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import type { Game } from '@/lib/types';

// This is your test secret API key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  const body = await req.json();
  const { cartItems, userId } = body as { cartItems: Game[], userId: string };

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
  }
  
  if (!userId) {
    return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
  }

  const origin = headers().get('origin') || 'http://localhost:9002';

  try {
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: [item.coverImage],
                    description: item.description,
                },
                unit_amount: Math.round(item.price * 100), // Price in cents
            },
            quantity: 1,
        };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        userId,
        gameIds: JSON.stringify(cartItems.map(item => item.id)),
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

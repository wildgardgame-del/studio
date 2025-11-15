
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import type { Game } from '@/lib/types';

// Make sure to have your Stripe secret key in your .env.local file
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

  const requestHeaders = headers();
  const origin = requestHeaders.get('origin') || 'http://localhost:9002';

  try {
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item) => {
        const price = item.price || 0;
        const imageUrl = item.coverImage && item.coverImage.startsWith('http') ? item.coverImage : undefined;


        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.title,
                    images: imageUrl ? [imageUrl] : [],
                    description: item.description,
                },
                unit_amount: Math.round(price * 100), // Price in cents
            },
            quantity: 1,
        };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        userId,
        gameIds: JSON.stringify(cartItems.map(item => item.id)),
        // Store prices for each game to handle DB write on success
        gamePrices: JSON.stringify(cartItems.map(item => ({ id: item.id, price: item.price }))),
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }
        
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        return NextResponse.json({ session });

    } catch (err: any) {
        console.error("Stripe session verification error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

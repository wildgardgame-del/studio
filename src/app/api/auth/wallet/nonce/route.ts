
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAdminFirestore } from '@/firebase/admin-app';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const nonce = uuidv4();
    const message = `Welcome to GameSphere!\n\nSign this message to authenticate your address: ${address}\n\nNonce: ${nonce}`;
    
    // Use the Admin Firestore instance with Admin SDK syntax
    const firestore = getAdminFirestore();
    const nonceRef = firestore.collection('nonces').doc(address);
    
    await nonceRef.set({ 
      nonce, 
      message,
      createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

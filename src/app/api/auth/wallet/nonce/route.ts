export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const nonce = uuidv4();
    const message = `Welcome to GameSphere!\n\nSign this message to authenticate your address: ${address}\n\nNonce: ${nonce}`;
    
    // Use standard client initialization to write the nonce
    const { firestore } = initializeFirebase();
    const nonceRef = doc(firestore, 'nonces', address);
    
    await setDoc(nonceRef, { 
      nonce, 
      message,
      createdAt: serverTimestamp() 
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

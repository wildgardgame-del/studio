
import { NextRequest, NextResponse } from 'next/server';
import { doc, deleteDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const nonceRef = doc(firestore, 'nonces', address);
    await deleteDoc(nonceRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Nonce deletion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

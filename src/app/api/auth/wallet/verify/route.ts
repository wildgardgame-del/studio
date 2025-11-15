
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Using modular auth
import { initializeFirebase } from '@/firebase';
import { getAdminApp } from '@/firebase/admin-app';

export async function POST(req: NextRequest) {
  try {
    const { address, signature } = await req.json();
    if (!address || !signature) {
      return NextResponse.json({ error: 'Address and signature are required' }, { status: 400 });
    }
    
    const { firestore } = initializeFirebase();
    const nonceRef = doc(firestore, 'nonces', address);
    const nonceDoc = await getDoc(nonceRef);

    if (!nonceDoc.exists()) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
    }

    const { message } = nonceDoc.data();
    
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    // Initialize Firebase Admin SDK
    const { auth: adminAuth } = getAdminApp();
    const customToken = await adminAuth.createCustomToken(address);
    
    return NextResponse.json({ token: customToken });

  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

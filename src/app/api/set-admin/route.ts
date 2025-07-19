
import { type NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp, getAdminAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const adminApp = initializeAdminApp();
    const db = getFirestore(adminApp);
    
    const { targetUid, isAdmin, updateData } = await req.json();

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing targetUid' }, { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Forbidden: Caller is not an admin' }, { status: 403 });
    }

    // Scenario 1: Update user role (set admin status)
    if (typeof isAdmin === 'boolean') {
      await getAdminAuth().setCustomUserClaims(targetUid, { admin: isAdmin });
      const userRef = db.collection('users').doc(targetUid);
      await userRef.set({ role: isAdmin ? 'admin' : 'user' }, { merge: true });
      return NextResponse.json({ message: `Successfully set user ${targetUid} admin status to ${isAdmin}` });
    }

    // Scenario 2: Update user profile data
    if (updateData) {
       const userRef = db.collection('users').doc(targetUid);
       // We only allow these specific fields to be updated by an admin via this API
       const allowedUpdates: { [key: string]: any } = {};
       if (updateData.displayName !== undefined && typeof updateData.displayName === 'string') allowedUpdates.displayName = updateData.displayName;
       if (updateData.bio !== undefined && typeof updateData.bio === 'string') allowedUpdates.bio = updateData.bio;
       if (updateData.location !== undefined && typeof updateData.location === 'string') allowedUpdates.location = updateData.location;

       if (Object.keys(allowedUpdates).length > 0) {
        await userRef.update(allowedUpdates);
        return NextResponse.json({ message: `Successfully updated user ${targetUid}'s profile.` });
       } else {
        return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
       }
    }

    return NextResponse.json({ error: 'Invalid request body. Provide either "isAdmin" or "updateData".' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in API route:', error);
    let status = 500;
    if (error.code?.startsWith('auth/')) {
        status = 401; // Typically auth errors
    } else if (error.message.includes('Forbidden')) {
        status = 403;
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}

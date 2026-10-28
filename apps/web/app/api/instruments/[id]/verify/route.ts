import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';
import { assertOfficerCanVerify } from '@/lib/auth/rbac';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = dataStore.getCurrentProfile();

    // Enforce Separation of Duties
    try {
      assertOfficerCanVerify(user);
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message, code: 'FORBIDDEN_SEPARATION_OF_DUTIES' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const notes = body.notes || 'Verified according to AICTE regulation standards and bank record confirmation.';

    const updated = await dataStore.verifyInstrument(id, user, notes);

    return NextResponse.json({
      success: true,
      instrument: updated,
      message: 'FDR instrument verified and marked active successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

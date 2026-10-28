import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';
import { assertOfficerCanVerify } from '@/lib/auth/rbac';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = dataStore.getUserFromRequest(request) || dataStore.getCurrentProfile();

    // Enforce Separation of Duties (Only Verification Officers & Bureau Heads can reject)
    try {
      assertOfficerCanVerify(user);
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message, code: 'FORBIDDEN_SEPARATION_OF_DUTIES' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || body.notes || '').trim();

    if (!reason) {
      return NextResponse.json(
        { error: 'A specific discrepancy or statutory rejection reason is required.' },
        { status: 400 }
      );
    }

    const updated = await dataStore.rejectInstrument(id, user, reason);

    return NextResponse.json({
      success: true,
      instrument: updated,
      message: 'FDR instrument rejected and institution notified of discrepancy.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

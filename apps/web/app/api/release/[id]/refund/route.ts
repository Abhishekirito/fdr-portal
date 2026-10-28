import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';
import { assertOfficerCanApproveRelease } from '@/lib/auth/rbac';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = dataStore.getCurrentProfile();

    try {
      assertOfficerCanApproveRelease(user);
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message, code: 'FORBIDDEN_SEPARATION_OF_DUTIES' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    const updated = await dataStore.confirmRefund(
      id,
      notes || 'Bank encashment certificate verified against bank statement.',
      user
    );

    return NextResponse.json({
      success: true,
      releaseRequest: updated,
      message: 'Bank encashment verified and refund confirmation recorded. Lifecycle closed.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

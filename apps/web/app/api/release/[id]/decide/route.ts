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

    // Separation of Duties check
    try {
      assertOfficerCanApproveRelease(user);
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message, code: 'FORBIDDEN_SEPARATION_OF_DUTIES' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { decision, reason } = body;

    if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
      return NextResponse.json({ error: 'Valid decision ("approved" or "rejected") is required' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Decision justification reason is mandatory' }, { status: 400 });
    }

    const updated = await dataStore.decideReleaseRequest(id, decision, reason.trim(), user);

    return NextResponse.json({
      success: true,
      releaseRequest: updated,
      message: decision === 'approved'
        ? 'Release NOC approved. Digital release certificate generated and signed.'
        : 'Release request rejected. Instrument reverted to active state.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

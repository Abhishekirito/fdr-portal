import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = dataStore.getCurrentProfile();
    const body = await request.json();

    const { reason } = body;
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'A mandatory justification reason is required for requesting deposit release.' },
        { status: 400 }
      );
    }

    const releaseReq = await dataStore.requestRelease(id, reason.trim(), user);

    return NextResponse.json({
      success: true,
      releaseRequest: releaseReq,
      message: 'Release request submitted to Regional Finance Officer queue.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const { fdr_number, amount, issue_date, maturity_date, file_name } = body;

    if (!fdr_number || !amount || !issue_date || !maturity_date) {
      return NextResponse.json(
        { error: 'Missing mandatory renewal fields (fdr_number, amount, issue_date, maturity_date)' },
        { status: 400 }
      );
    }

    const newInstrument = await dataStore.renewInstrument(id, {
      fdr_number,
      amount: parseFloat(amount),
      issue_date,
      maturity_date,
      submitted_by: user.id,
      file_name: file_name || `renewal_scan_${fdr_number}.pdf`,
    });

    return NextResponse.json({
      success: true,
      instrument: newInstrument,
      message: 'Renewal linked instrument created. Original instrument marked renewed.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

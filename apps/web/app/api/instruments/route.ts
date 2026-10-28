import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

export async function GET(request: Request) {
  try {
    const user = dataStore.getUserFromRequest(request) || dataStore.getCurrentProfile();
    await dataStore.syncFromDatabase();
    const instruments = dataStore.getInstruments(user);
    return NextResponse.json({
      instruments,
      total: instruments.length,
      userRole: user.role,
      userRegion: user.region?.name || 'All Regions',
      source: 'supabase_cloud',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = dataStore.getCurrentProfile();
    const body = await request.json();

    const {
      bank_id,
      fdr_number,
      amount,
      issue_date,
      maturity_date,
      file_name,
      file_data,
      file_size,
      mime_type,
      ocr_extracted,
      flagged,
      flag_severity,
      discrepancy_notes,
    } = body;

    if (!bank_id || !fdr_number || !amount || !issue_date || !maturity_date) {
      return NextResponse.json(
        { error: 'Missing mandatory FDR fields (bank, fdr_number, amount, issue_date, maturity_date)' },
        { status: 400 }
      );
    }

    const institution_id = user.institution_id || body.institution_id || 'aaaa1111-1111-1111-1111-111111111111';

    const instrument = await dataStore.submitFDR({
      institution_id,
      bank_id,
      fdr_number,
      amount: parseFloat(amount),
      issue_date,
      maturity_date,
      submitted_by: user.id,
      file_name: file_name || `scan_${fdr_number}.pdf`,
      file_data,
      file_size,
      mime_type,
      ocr_extracted,
      flagged,
      flag_severity,
      discrepancy_notes,
    });

    return NextResponse.json({
      success: true,
      instrument,
      message: 'FDR submitted successfully. Document recorded and chained into cryptographic audit log.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

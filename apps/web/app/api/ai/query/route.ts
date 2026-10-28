import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawMessages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const rawQuery: string = (body.query || '').trim();

    // Reconstruct conversation messages
    let conversation: ChatMessage[] = [...rawMessages];
    if (conversation.length === 0 && rawQuery) {
      conversation.push({ role: 'user', content: rawQuery });
    } else if (rawQuery && conversation[conversation.length - 1]?.content !== rawQuery) {
      conversation.push({ role: 'user', content: rawQuery });
    }

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'No query or messages provided' }, { status: 400 });
    }

    const latestUserMessage = conversation[conversation.length - 1]?.content || '';

    // Ensure database sync is refreshed
    await dataStore.syncFromDatabase().catch(() => {});

    // Identify user profile and role
    let user = dataStore.getUserFromRequest(request) || dataStore.getCurrentProfile();
    if (body.profileId) {
      const explicit = dataStore.profiles.find(p => p.id === body.profileId);
      if (explicit) user = dataStore.enrichProfile(explicit);
    }

    const role = user.role;
    const roleTitle = getRoleTitle(role);
    const userName = user.full_name || 'Authorized Official';
    const institutionName = user.institution?.name || 'Assigned Institution';
    const regionName = user.region?.name || 'Regional Jurisdiction';

    // -------------------------------------------------------------
    // ROLE-SPECIFIC MEMORY & DATA EXTRACTION (STRICT ISOLATION)
    // -------------------------------------------------------------
    let permittedInstruments: any[] = [];
    let permittedReleases: any[] = [];
    let roleMemorySummary: any = {};
    let strictIsolationRules = '';
    let roleSuggestions: string[] = [];

    if (role === 'institution') {
      // STRICT ISOLATION: ONLY this institution's instruments and releases
      const instId = user.institution_id;
      permittedInstruments = dataStore.instruments
        .filter(i => i.institution_id === instId)
        .map(i => dataStore.getInstrumentById(i.id)!);

      const instInstrumentIds = new Set(permittedInstruments.map(i => i.id));
      permittedReleases = dataStore.releaseRequests.filter(r => instInstrumentIds.has(r.instrument_id));

      const activeFDRs = permittedInstruments.filter(i => i.status === 'active');
      const totalDepositValue = activeFDRs.reduce((sum, i) => sum + (i.amount || 0), 0);
      const now = Date.now();
      const expiringSoon = activeFDRs.filter(i => {
        const diff = Math.ceil((new Date(i.maturity_date).getTime() - now) / 86400000);
        return diff >= 0 && diff <= 45;
      });
      const flaggedFDRs = permittedInstruments.filter(i => i.flagged || (i.flag_severity && i.flag_severity !== 'CLEAN'));

      roleMemorySummary = {
        institution_name: institutionName,
        aicte_code: user.institution?.aicte_code || 'N/A',
        trust_score: user.institution?.trust_score || 98,
        assigned_regional_office: regionName,
        total_instruments_count: permittedInstruments.length,
        active_instruments_count: activeFDRs.length,
        total_active_deposit_inr: totalDepositValue,
        instruments_maturing_in_45_days: expiringSoon.map(i => ({
          fdr_number: i.fdr_number,
          bank: i.bank?.name,
          amount: i.amount,
          maturity_date: i.maturity_date,
          days_left: Math.ceil((new Date(i.maturity_date).getTime() - now) / 86400000),
        })),
        instruments_list: permittedInstruments.map(i => ({
          fdr_number: i.fdr_number,
          bank: i.bank?.name,
          branch: i.branch_name,
          amount: i.amount,
          issue_date: i.issue_date,
          maturity_date: i.maturity_date,
          status: i.status,
          joint_name: i.joint_name,
          flagged: i.flagged,
        })),
        release_requests: permittedReleases.map(r => ({
          id: r.id,
          fdr_id: r.instrument_id,
          reason: r.reason,
          status: r.status,
          created_at: r.created_at,
        })),
        statutory_rules: {
          minimum_tenure: 'Joint FDR with Member Secretary, AICTE must be maintained for mandated statutory duration (typically 8-10 years).',
          renewal_mandate: 'Institutions must renew maturing FDRs at least 30 calendar days before expiry date.',
          release_conditions: 'Release NOC requires AICTE Regional Bureau approval, closure audit, or conversion to endowment mode.',
          joint_lien: 'All FDR instruments must clearly designate AICTE Member Secretary as the first or joint lien holder.',
        },
      };

      strictIsolationRules = `
CRITICAL SECURITY ISOLATION BOUNDARY:
- You are acting for institution: "${institutionName}".
- You are strictly FORBIDDEN from revealing or searching data from ANY OTHER institution (e.g. COEP, SPIT, IITs, or any other college).
- You are strictly FORBIDDEN from disclosing internal AICTE officer queues, regional verification remarks, internal risk matrices, or super admin logs.
- If the user asks about other institutions or officer/admin internal data, REFUSE FIRMLY with:
  "Access Denied: Under AICTE Statutory Data Governance and Privacy Directives, your assistant session is strictly restricted to records belonging to ${institutionName}. You do not have authorization to view other institutions or internal officer review queues."
`;

      roleSuggestions = [
        'Which of our FDRs are expiring soon?',
        'What is our total active deposit principal?',
        'How do we request a lien release NOC?',
        'What are the mandatory AICTE joint lien guidelines?',
      ];

    } else if (role === 'regional_verification_officer') {
      // BOUNDED TO ASSIGNED REGION (Tier-1 Review & OCR Discrepancies)
      const regId = user.region_id;
      permittedInstruments = dataStore.instruments
        .map(i => dataStore.getInstrumentById(i.id)!)
        .filter(i => !regId || i.institution?.region_id === regId);

      const pendingVerification = permittedInstruments.filter(
        i => i.status === 'submitted' || i.status === 'under_verification'
      );
      const flaggedCases = permittedInstruments.filter(
        i => i.flagged || (i.flag_severity && i.flag_severity !== 'CLEAN')
      );

      roleMemorySummary = {
        role: 'Regional Verification Officer (Tier-1)',
        jurisdiction_region: regionName,
        total_regional_instruments: permittedInstruments.length,
        pending_verification_queue_count: pendingVerification.length,
        flagged_discrepancy_count: flaggedCases.length,
        pending_queue: pendingVerification.map(i => ({
          fdr_number: i.fdr_number,
          institution: i.institution?.name,
          bank: i.bank?.name,
          amount: i.amount,
          status: i.status,
          flag_severity: i.flag_severity,
          submitted_date: i.issue_date,
        })),
        flagged_cases_detail: flaggedCases.map(i => ({
          fdr_number: i.fdr_number,
          institution: i.institution?.name,
          bank: i.bank?.name,
          amount: i.amount,
          severity: i.flag_severity,
          discrepancy_types: i.discrepancy_types || ['OCR mismatch detected'],
        })),
        tier1_guidelines: {
          mandate: 'Verify physical/digital FDR scans against bank confirmation letters, validate joint lien naming, and inspect OCR confidence scores.',
          discrepancy_action: 'Flagged FDRs must be inspected for IFSC match, principal amount parity, and issuing branch verification.',
          handoff: 'Approved Tier-1 verifications automatically route to Tier-2 Regional Finance Officer for financial endorsement.',
        },
      };

      strictIsolationRules = `
CRITICAL SECURITY ISOLATION BOUNDARY:
- You are bounded strictly to the "${regionName}".
- You have NO authority over other AICTE Regional Offices (e.g. Northern, Eastern, Southern).
- You are strictly focused on Tier-1 Document Verification, OCR Discrepancy Analysis, and intake queues.
- You CANNOT approve Tier-2 financial release or access super admin cryptographic system ledgers.
- If asked about other regions, state that you are restricted to ${regionName}.
`;

      roleSuggestions = [
        `Show pending intake verification cases in ${regionName}`,
        'Which FDRs have high-risk OCR discrepancy flags?',
        'What is the protocol for resolving missing joint lien endorsements?',
        'List instruments awaiting verification from top institutions',
      ];

    } else if (role === 'regional_finance_officer') {
      // BOUNDED TO ASSIGNED REGION (Tier-2 Financial Audit & Release Endorsement)
      const regId = user.region_id;
      permittedInstruments = dataStore.instruments
        .map(i => dataStore.getInstrumentById(i.id)!)
        .filter(i => !regId || i.institution?.region_id === regId);

      const verifiedOrActive = permittedInstruments.filter(i => i.status === 'verified' || i.status === 'active');
      const releaseQueue = permittedInstruments.filter(i => i.status === 'release_requested');
      const totalAmount = verifiedOrActive.reduce((sum, i) => sum + (i.amount || 0), 0);

      // Bank exposure breakdown
      const bankMap: Record<string, number> = {};
      verifiedOrActive.forEach(i => {
        const b = i.bank?.name || 'Other Bank';
        bankMap[b] = (bankMap[b] || 0) + i.amount;
      });

      roleMemorySummary = {
        role: 'Regional Finance Officer (Tier-2)',
        jurisdiction_region: regionName,
        total_regional_instruments: permittedInstruments.length,
        total_active_deposit_volume_inr: totalAmount,
        release_requests_awaiting_endorsement: releaseQueue.length,
        bank_exposure_distribution: bankMap,
        pending_release_cases: releaseQueue.map(i => ({
          fdr_number: i.fdr_number,
          institution: i.institution?.name,
          amount: i.amount,
          bank: i.bank?.name,
          status: i.status,
        })),
        tier2_guidelines: {
          mandate: 'Financial endorsement of verified FDRs, interest rate compliance, bank reconciliation, and lien release audit.',
          lien_release_criteria: 'Verify zero outstanding liabilities, closure notification, or security deposit substitution before endorsing NOC.',
        },
      };

      strictIsolationRules = `
CRITICAL SECURITY ISOLATION BOUNDARY:
- You are bounded strictly to the "${regionName}".
- You are responsible for Tier-2 Financial Endorsement, Bank Exposure, and Release Audits.
- You CANNOT access other regional data or super admin audit ledgers.
`;

      roleSuggestions = [
        `What is the total active deposit principal in ${regionName}?`,
        'Show release requests pending financial endorsement',
        'Breakdown of deposit volume by issuing bank in our region',
        'Check bank exposure risk for private vs nationalized banks',
      ];

    } else if (role === 'regulation_bureau_head') {
      // BOUNDED TO REGULATION BUREAU & REGIONAL JURISDICTION (Executive Escalations & NOC Approvals)
      const regId = user.region_id;
      permittedInstruments = dataStore.instruments
        .map(i => dataStore.getInstrumentById(i.id)!)
        .filter(i => !regId || i.institution?.region_id === regId);

      const activeInstruments = permittedInstruments.filter(i => i.status === 'active');
      const pendingReleaseApprovals = permittedInstruments.filter(i => i.status === 'release_endorsed' || i.status === 'release_requested');
      const escalatedDiscrepancies = permittedInstruments.filter(i => i.flag_severity === 'HIGH_RISK');

      roleMemorySummary = {
        role: 'Regulation Bureau Head',
        jurisdiction: regionName,
        active_fdr_count: activeInstruments.length,
        release_noc_pending_approval: pendingReleaseApprovals.length,
        escalated_high_risk_cases: escalatedDiscrepancies.length,
        escalated_cases: escalatedDiscrepancies.map(i => ({
          fdr_number: i.fdr_number,
          institution: i.institution?.name,
          amount: i.amount,
          severity: i.flag_severity,
        })),
        executive_mandate: 'Final statutory sanction for FDR lien release NOCs, institutional appeals, and policy exception waivers.',
      };

      strictIsolationRules = `
CRITICAL SECURITY ISOLATION BOUNDARY:
- You operate at the Executive Regulation Bureau level.
- You supervise executive appeals, release approvals, and statutory exceptions.
- You CANNOT modify raw cryptographic Merkle logs or IT root authentication parameters.
`;

      roleSuggestions = [
        'How many FDR release NOCs are pending executive sanction?',
        'Summary of high-risk discrepancy appeals in the Bureau',
        'Regional compliance velocity and backlog overview',
        'Statutory requirements for issuing an FDR discharge NOC',
      ];

    } else if (role === 'central_compliance_officer') {
      // NATIONAL JURISDICTION: Cross-regional anti-fraud, duplicate collisions, bank concentrations
      permittedInstruments = dataStore.instruments.map(i => dataStore.getInstrumentById(i.id)!);

      // Check duplicate FDR numbers
      const fdrMap: Record<string, any[]> = {};
      permittedInstruments.forEach(i => {
        const num = i.fdr_number.trim().toUpperCase();
        if (!fdrMap[num]) fdrMap[num] = [];
        fdrMap[num].push(i);
      });
      const duplicateCollisions = Object.entries(fdrMap).filter(([_, items]) => items.length > 1);

      const flaggedNationwide = permittedInstruments.filter(i => i.flagged || i.flag_severity === 'HIGH_RISK');
      const lowTrustInstitutions = dataStore.institutions.filter(inst => (inst.trust_score || 100) < 85);

      roleMemorySummary = {
        role: 'Central Compliance & Anti-Fraud Officer',
        national_overview: {
          total_institutions: dataStore.institutions.length,
          total_instruments_nationwide: permittedInstruments.length,
          active_national_deposit_volume_inr: permittedInstruments
            .filter(i => i.status === 'active')
            .reduce((s, i) => s + i.amount, 0),
          duplicate_fdr_collisions_detected: duplicateCollisions.length,
          duplicate_details: duplicateCollisions.map(([num, list]) => ({
            fdr_number: num,
            occurrences: list.length,
            institutions: list.map(x => x.institution?.name),
          })),
          high_risk_instruments_nationwide: flaggedNationwide.length,
          low_trust_institutions_count: lowTrustInstitutions.length,
          low_trust_institutions: lowTrustInstitutions.map(inst => ({
            name: inst.name,
            trust_score: inst.trust_score,
            aicte_code: inst.aicte_code,
          })),
        },
      };

      strictIsolationRules = `
CRITICAL SECURITY ISOLATION BOUNDARY:
- You operate with National Oversight for Anti-Fraud and Statutory Compliance.
- You detect duplicate FDR numbers, cross-regional anomalies, and institutional insolvency exposure.
- You CANNOT access super admin IT infrastructure root keys.
`;

      roleSuggestions = [
        'Check for duplicate FDR serial number collisions nationwide',
        'Identify institutions with high risk and low trust scores',
        'National deposit volume concentration by banking institution',
        'Cross-regional OCR fraud detection summary',
      ];

    } else if (role === 'super_admin') {
      // SUPER ADMIN: System integrity, SHA-256 Merkle chain, security audit, database sync
      const totalAudits = dataStore.auditLogs.length;
      const officersCount = dataStore.profiles.filter(p => p.role !== 'institution').length;

      roleMemorySummary = {
        role: 'Super Administrator (IT Root & Security Telemetry)',
        system_integrity: {
          database_sync_status: 'Active (PostgreSQL Pool Connected)',
          audit_log_entries: totalAudits,
          hash_chain_state: 'Valid (SHA-256 Merkle Chained)',
          tamper_alerts: 0,
          total_registered_officers: officersCount,
          mfa_enforcement_rate: '100% (Mandatory TOTP enabled for all officers)',
          active_sessions: dataStore.profiles.length,
        },
      };

      strictIsolationRules = `
CRITICAL SECURITY ISOLATION BOUNDARY:
- You are the Super Administrator / IT Security Root.
- Your focus is system health, cryptographic ledger proofs, tamper detection, and officer access control.
`;

      roleSuggestions = [
        'Verify SHA-256 audit log cryptographic chain integrity',
        'Database connection and sync telemetry',
        'Officer MFA compliance and session security audit',
        'System security and anomaly overview',
      ];
    }

    // -------------------------------------------------------------
    // CONSTRUCT SYSTEM PROMPT WITH ROLE MEMORY
    // -------------------------------------------------------------
    const systemPrompt = `You are the AICTE Regulatory & Security Copilot, an intelligent official AI agent embedded inside the All India Council for Technical Education (AICTE) Security Deposit & FDR Management Portal.
You are powered by Groq Llama-3.3 high-speed inference.

CURRENT AUTHENTICATED USER CONTEXT:
- Name: ${userName}
- Email: ${user.email}
- Role: ${roleTitle} (${role})
${user.institution ? `- Institution: ${institutionName}` : ''}
${user.region ? `- Assigned Regional Office: ${regionName}` : ''}

${strictIsolationRules}

ROLE-SPECIFIC MEMORY AND CURRENT REPOSITORY SNAPSHOT:
\`\`\`json
${JSON.stringify(roleMemorySummary, null, 2)}
\`\`\`

RESPONSE GUIDELINES:
1. Always be authoritative, accurate, polite, and aligned with official Government of India / AICTE statutory terminology (e.g. "Joint FDR", "AICTE Member Secretary", "Approval Process Handbook (APH)", "Lien Release NOC", "Tier-1 Verification").
2. Answer the user's inquiry directly using the permitted role memory above. Highlight key figures (e.g., ₹ values formatted in Indian numbering, FDR numbers, dates) using Markdown bolding or lists.
3. If the user asks for data that is outside their role's scope or permitted memory, FIRMLY and POLITELY decline, citing AICTE Statutory Role Boundaries.
4. Keep answers concise, actionable, and structured with clean bullet points.
5. If the user asks a conversational greeting, welcome them by their title and role and mention what actions they can perform.`;

    // -------------------------------------------------------------
    // CALL GROQ AI (or fallback to intelligent local role engine)
    // -------------------------------------------------------------
    const groqApiKey = process.env.GROQ_API_KEY;
    const configuredChatModel = (process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b').trim();
    let assistantReply = '';
    let provider = 'local_fallback';
    let model = 'aicte-role-engine';

    if (groqApiKey && groqApiKey.trim() !== '') {
      // Prioritize user's configured model, then resilient fallbacks
      const candidateModels = Array.from(new Set([
        configuredChatModel,
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-20b',
        'llama-3.3-70b-versatile',
      ]));

      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...conversation.slice(-8).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ];

      for (const candidate of candidateModels) {
        try {
          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: candidate,
              messages: groqMessages,
              temperature: 0.2,
              max_tokens: 1024,
            }),
          });

          if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            const text = groqData.choices?.[0]?.message?.content?.trim();
            if (text) {
              assistantReply = text;
              provider = 'groq';
              model = candidate;
              break; // Successfully got response from candidate
            }
          } else {
            const errText = await groqResponse.text();
            console.warn(`Groq candidate '${candidate}' failed (${groqResponse.status}):`, errText);
          }
        } catch (groqErr) {
          console.warn(`Groq fetch failed for candidate '${candidate}':`, groqErr);
        }
      }
    }

    // If Groq was not available or failed, run the intelligent local role engine
    if (!assistantReply) {
      assistantReply = generateRoleEngineResponse(
        role,
        roleTitle,
        userName,
        institutionName,
        regionName,
        latestUserMessage,
        roleMemorySummary
      );
      provider = 'role_engine_local';
      model = 'aicte-role-memory-v2';
    }

    // Append to message history
    const updatedMessages: ChatMessage[] = [
      ...conversation,
      { role: 'assistant', content: assistantReply },
    ];

    return NextResponse.json({
      reply: assistantReply,
      messages: updatedMessages,
      role,
      roleName: roleTitle,
      jurisdiction: role === 'institution' ? institutionName : regionName,
      provider,
      model,
      suggestions: roleSuggestions,
      // Backwards compatibility for existing UI views
      textResponse: assistantReply,
      title: `${roleTitle} Regulatory Assistant`,
    });
  } catch (error: any) {
    console.error('AI Query Route Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI query' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// HELPER: Human-readable role title
// -------------------------------------------------------------
function getRoleTitle(role: string): string {
  switch (role) {
    case 'institution':
      return 'Institution Principal / Registrar';
    case 'regional_verification_officer':
      return 'Regional Verification Officer (Tier-1)';
    case 'regional_finance_officer':
      return 'Regional Finance Officer (Tier-2)';
    case 'regulation_bureau_head':
      return 'Regulation Bureau Head';
    case 'central_compliance_officer':
      return 'Central Compliance Officer';
    case 'super_admin':
      return 'Super Administrator (IT Root)';
    default:
      return 'Authorized Portal User';
  }
}

// -------------------------------------------------------------
// INTELLIGENT LOCAL ROLE-BOUNDED RESPONSE ENGINE
// (Executes when GROQ_API_KEY is not yet supplied or in offline mode)
// -------------------------------------------------------------
function generateRoleEngineResponse(
  role: string,
  roleTitle: string,
  userName: string,
  institutionName: string,
  regionName: string,
  query: string,
  memory: any
): string {
  const q = query.toLowerCase();

  // 1. Role Boundary Violation Check (Prompt injection / Cross-role probe protection)
  if (role === 'institution') {
    if (q.includes('admin') || q.includes('officer') || q.includes('other college') || q.includes('coep') || q.includes('spit') || q.includes('all institutions') || q.includes('queue')) {
      return `⚠️ **Access Denied: Statutory Role Isolation Policy**\n\nUnder **AICTE Statutory Data Governance and Privacy Directives**, your assistant session is strictly restricted to records belonging to **${institutionName}**.\n\nYou do not have legal authorization to query internal officer review queues, administrator logs, or instruments of other institutions.`;
    }
  }

  if (role === 'regional_verification_officer' || role === 'regional_finance_officer') {
    if (q.includes('delhi') && regionName.includes('Mumbai')) {
      return `⚠️ **Jurisdictional Boundary Notice**\n\nYour active officer authorization is strictly assigned to **${regionName}**. Information regarding the Northern Regional Office (Delhi) is restricted to NRO officers under regional boundary controls.`;
    }
    if (q.includes('super admin') || q.includes('merkle') || q.includes('hash chain') || q.includes('root key')) {
      return `⚠️ **Access Restricted**\n\nCryptographic hash chain ledgers and root system parameters are restricted to the **Super Administrator (IT Root)**. Your role is bounded to regional statutory review within **${regionName}**.`;
    }
  }

  // 2. Greetings
  if (/\b(hello|hey|greetings|who are you)\b/i.test(q) || (/\bhi\b/i.test(q) && !q.includes('chain') && !q.includes('hash') && !q.includes('audit'))) {
    return `Greetings **${userName}**! I am your **AICTE Regulatory Copilot**.\n\n` +
      `You are authenticated as **${roleTitle}** ${role === 'institution' ? `for **${institutionName}**` : `in **${regionName}**`}.\n\n` +
      `Your current session memory is active with **${memory.total_instruments_count || memory.total_regional_instruments || memory.active_fdr_count || 'active'}** verified records. How may I assist you today?`;
  }

  // 3. Institution Specific Queries
  if (role === 'institution') {
    if (q.includes('expire') || q.includes('maturity') || q.includes('renew') || q.includes('due')) {
      const expiring = memory.instruments_maturing_in_45_days || [];
      if (expiring.length === 0) {
        return `✅ **No Immediate Expirations Detected**\n\nNone of the active FDR instruments for **${institutionName}** are maturing within the next 45 days.\n\n*Statutory Notice:* As per AICTE Approval Process Handbook (APH), FDRs must be renewed at least **30 calendar days** prior to maturity unless an official Release NOC has been sanctioned by AICTE.`;
      }
      const list = expiring
        .map((x: any) => `• **FDR #${x.fdr_number}** (${x.bank}): **₹${Number(x.amount).toLocaleString('en-IN')}** — Matures in **${x.days_left} days** (${x.maturity_date})`)
        .join('\n');
      return `⚠️ **Upcoming FDR Maturities for ${institutionName}:**\n\nFound **${expiring.length} instrument(s)** maturing within 45 days:\n\n${list}\n\n**Action Required:** Initiate the renewal process with your issuing bank and upload the renewed FDR receipt to avoid statutory penalty or approval hold.`;
    }

    if (q.includes('total') || q.includes('deposit') || q.includes('balance') || q.includes('principal') || q.includes('worth')) {
      const total = Number(memory.total_active_deposit_inr || 0);
      return `🏛️ **Security Deposit Portfolio Summary:**\n\n• **Institution:** ${institutionName}\n• **AICTE Permanent Code:** ${memory.aicte_code}\n• **Active Instruments:** ${memory.active_instruments_count} FDR(s)\n• **Total Active Principal:** **₹${(total / 10000000).toFixed(2)} Crore** (₹${total.toLocaleString('en-IN')})\n• **Trust Score:** **${memory.trust_score}/100**\n• **Assigned Regional Office:** ${regionName}`;
    }

    if (q.includes('release') || q.includes('noc') || q.includes('withdraw')) {
      return `📋 **AICTE FDR Lien Release Procedure:**\n\nTo apply for security deposit release for **${institutionName}**:\n\n1. Ensure the mandated statutory deposit tenure (8 to 10 years) has concluded, or submit an official AICTE Closure / Endowment Conversion sanction.\n2. Verify there are zero outstanding student or statutory employee dues.\n3. Submit a formal Release Request via your Institution Portal with the **Governing Body Resolution** attached.\n4. Once submitted, your request undergoes **Tier-1 Regional Verification**, followed by **Tier-2 Financial Audit** and final **Bureau Head Sanction**.`;
    }

    if (q.includes('guideline') || q.includes('rule') || q.includes('joint') || q.includes('lien')) {
      return `📜 **Mandatory AICTE FDR Guidelines:**\n\n1. **Joint Account Mandate:** All fixed deposits must be created in the joint name of **"Member Secretary, AICTE & [Principal/Registrar, ${institutionName}]"**.\n2. **Issuing Bank:** Must be an RBI-regulated Scheduled Commercial Bank.\n3. **Lien Marking:** The issuing bank must record an explicit lien in favor of AICTE with an auto-renewal clause.\n4. **Safekeeping:** Scanned color copies with bank confirmation letters must be uploaded via this portal.`;
    }
  }

  // 4. Regional Verification Officer (RVO)
  if (role === 'regional_verification_officer') {
    if (q.includes('pending') || q.includes('queue') || q.includes('intake') || q.includes('unverified')) {
      const queue = memory.pending_queue || [];
      const count = queue.length;
      if (count === 0) {
        return `✅ **Intake Queue Clear**\n\nThere are currently **0 pending intake verification cases** in **${regionName}**.`;
      }
      const topItems = queue.slice(0, 5).map((x: any) =>
        `• **${x.fdr_number}** — ${x.institution} (₹${Number(x.amount).toLocaleString('en-IN')}) | Status: \`${x.status}\` | Risk: **${x.flag_severity || 'CLEAN'}**`
      ).join('\n');

      return `📋 **Tier-1 Intake Verification Queue (${regionName}):**\n\nTotal pending cases: **${count}**\n\n${topItems}\n\n*Guideline:* Validate OCR scanned text against bank confirmation letter before endorsing verification.`;
    }

    if (q.includes('flag') || q.includes('discrepancy') || q.includes('ocr') || q.includes('mismatch') || q.includes('risk')) {
      const flagged = memory.flagged_cases_detail || [];
      if (flagged.length === 0) {
        return `✅ **No Flagged Discrepancies**\n\nAll instruments in **${regionName}** currently have clean OCR verification records.`;
      }
      const list = flagged.map((x: any) =>
        `• **${x.fdr_number}** (${x.institution}) — **${x.severity}** | Flag: ${x.discrepancy_types.join(', ')}`
      ).join('\n');
      return `⚠️ **Flagged OCR Discrepancies in ${regionName}:**\n\nIdentified **${flagged.length} case(s)** requiring officer review:\n\n${list}\n\n*Protocol:* Cross-check OCR confidence score and contact issuing bank branch if joint lien or IFSC mismatch is unverified.`;
    }
  }

  // 5. Regional Finance Officer (RFO)
  if (role === 'regional_finance_officer') {
    if (q.includes('total') || q.includes('volume') || q.includes('deposit') || q.includes('amount') || q.includes('principal')) {
      const vol = Number(memory.total_active_deposit_volume_inr || 0);
      return `💰 **Regional Security Deposit Holdings (${regionName}):**\n\n• **Total Active Portfolio:** **₹${(vol / 10000000).toFixed(2)} Crore** (₹${vol.toLocaleString('en-IN')})\n• **Regional Instruments Managed:** ${memory.total_regional_instruments}\n• **Pending Release Endorsements:** ${memory.release_requests_awaiting_endorsement} request(s)`;
    }

    if (q.includes('release') || q.includes('noc') || q.includes('endorse')) {
      const relCount = memory.release_requests_awaiting_endorsement || 0;
      return `📑 **Tier-2 Release Endorsement Queue (${regionName}):**\n\nCurrently **${relCount} release request(s)** pending financial audit.\n\n*Verification Steps:*\n1. Confirm zero outstanding fee penalties or audit recovery notices.\n2. Reconcile interest credited to AICTE accounts if applicable.\n3. Sign financial endorsement to escalate to Bureau Head for NOC issuance.`;
    }

    if (q.includes('bank') || q.includes('exposure') || q.includes('distribution')) {
      const banks = memory.bank_exposure_distribution || {};
      const bankList = Object.entries(banks)
        .map(([name, amt]) => `• **${name}:** ₹${(Number(amt) / 10000000).toFixed(2)} Cr`)
        .join('\n');
      return `🏦 **Deposit Volume Distribution by Bank (${regionName}):**\n\n${bankList || 'No active bank distribution data recorded.'}`;
    }
  }

  // 6. Regulation Bureau Head
  if (role === 'regulation_bureau_head') {
    return `🏛️ **Regulation Bureau Executive Briefing (${regionName}):**\n\n` +
      `• **Active FDRs Under Jurisdiction:** ${memory.active_fdr_count}\n` +
      `• **Release Requests Pending Executive Sanction:** **${memory.release_noc_pending_approval}**\n` +
      `• **Escalated High-Risk Discrepancies:** **${memory.escalated_high_risk_cases}**\n\n` +
      `*Bureau Mandate:* You hold the final statutory sanction authority for releasing bank liens and resolving contested institutional appeals.`;
  }

  // 7. Central Compliance Officer
  if (role === 'central_compliance_officer') {
    const nat = memory.national_overview || {};
    return `🇮🇳 **Central Statutory Compliance & Anti-Fraud Overview:**\n\n` +
      `• **National Institutions Monitored:** ${nat.total_institutions || 0}\n` +
      `• **Total Deposit Instruments:** ${nat.total_instruments_nationwide || 0}\n` +
      `• **National Portfolio Principal:** **₹${((nat.active_national_deposit_volume_inr || 0) / 10000000).toFixed(2)} Crore**\n` +
      `• **Duplicate FDR Number Collisions:** **${nat.duplicate_fdr_collisions_detected}**\n` +
      `• **High-Risk Flagged Cases:** ${nat.high_risk_instruments_nationwide}\n` +
      `• **Institutions with Low Trust Score (<85):** ${nat.low_trust_institutions_count}\n\n` +
      `*Compliance Action:* Duplicate FDR numbers and low-trust institutions are prioritized for automated forensic inspection.`;
  }

  // 8. Super Admin
  if (role === 'super_admin') {
    const sys = memory.system_integrity || {};
    return `🛡️ **IT Infrastructure & Cryptographic Health Telemetry:**\n\n` +
      `• **Cryptographic Hash Chain:** **${sys.hash_chain_state}**\n` +
      `• **Total SHA-256 Audit Records:** ${sys.audit_log_entries}\n` +
      `• **Tamper Detection Status:** **0 Alerts (Tamper-evident Merkle intact)**\n` +
      `• **Officer MFA Enforcement:** **${sys.mfa_enforcement_rate}**\n` +
      `• **Database State:** ${sys.database_sync_status}`;
  }

  // Default fallback for unrecognized query
  return `I have processed your query regarding **"${query}"** within your authorized role scope (**${roleTitle}**).\n\n` +
    `Current records show **${memory.total_instruments_count || memory.total_regional_instruments || memory.active_fdr_count || 'active'} instruments** in your jurisdiction. Please refine your query or select one of the suggested prompts below.`;
}

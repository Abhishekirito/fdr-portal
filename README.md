<div align="center">
  <img
    src="resource/AICTE_logo.png"
    alt="AICTE Security Deposit and FDR Management Portal"
    width="100%"
  />
</div>


# AICTE Security Deposit & FDR Management Portal

[![AICTE Regulation Bureau](https://img.shields.io/badge/AICTE-Regulation%20Bureau-0f2b48.svg)](https://www.aicte-india.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8.svg)](https://tailwindcss.com)
[![Supabase Cloud](https://img.shields.io/badge/Supabase-Live%20Cloud%20PostgreSQL-3ecf8e.svg)](https://supabase.com)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Dual--Model%20Architecture-f97316.svg)](https://groq.com)
[![Security](https://img.shields.io/badge/Audit%20Ledger-SHA--256%20Hash%20Chained-emerald.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%20AI%20OCR-009688.svg)](https://fastapi.tiangolo.com)

> **Problem Statement 26265**: AICTE Regulation Bureau — Smart Automation  
> A centralized, production-ready, role-based governance portal for the AICTE Regulation Bureau to manage institution security deposits and Fixed Deposit Receipts (FDRs): digital submission with Groq AI OCR auto-extraction, two-tier regional verification & statutory rejection workflow, automated maturity monitoring, chained renewals, digital release NOCs, tamper-evident cryptographic audit trails, role-isolated conversational AI assistant, and dedicated role-scoped statutory notification desks.

---

## 📑 Table of Contents
1. [Recent Major Updates & Enhancements](#-recent-major-updates--enhancements)
2. [End-to-End Workflow](#-end-to-end-workflow)
3. [Technical Architecture](#-technical-architecture)
4. [User Roles & Feature Breakdown](#-user-roles--feature-breakdown)
5. [Regional Officer FDR Verification & Rejection System](#-regional-officer-fdr-verification--rejection-system)
6. [Dual-Model Groq AI Architecture (Assistant & OCR)](#-dual-model-groq-ai-architecture-assistant--ocr)
7. [Dedicated Role-Scoped Notification System](#-dedicated-role-scoped-notification-system)
8. [Checks & Balances: Separation of Duties (SoD)](#-checks--balances-separation-of-duties-sod)
9. [Production Authentication & Dedicated Gateways](#-production-authentication--dedicated-gateways)
10. [Key Innovations & Differentiators](#-key-innovations--differentiators)
11. [Getting Started & Local Execution](#-getting-started--local-execution)
12. [Repository Structure](#-repository-structure)

---

## 🚀 Recent Major Updates & Enhancements

* **Regional Verification Officer (RVO) FDR Rejection Feature**:
  - **Statutory Rejection Capability**: RVOs and Bureau Heads can now formally reject non-compliant FDR submissions directly from the verification queue.
  - **Preset Discrepancy Chips**: Rejection modal includes quick statutory discrepancy presets (amount mismatch, maturity lock-in breach, non-joint lien endorsement, illegible scan, invalid bank branch) plus an editable remarks textarea.
  - **Cryptographic & Database Sync**: Rejection marks instrument status as `rejected`, flags as `HIGH_RISK`, writes discrepancy notes into verification records, appends a cryptographically signed SHA-256 block (`REJECT_INSTRUMENT`) to the immutable audit chain, and writes to live PostgreSQL.
  - **Instant Role-Scoped Alert**: Dispatches a high-priority `VERIFICATION_REJECTED` notification to the technical institution with discrepancy details and rectification guidance.
  - **Separation of Duties Hard Barrier**: Super Admin and Finance Officers are strictly barred (`HTTP 403 Forbidden`) from executing rejections; only L1 Verification Officers and Bureau Heads can reject.
  - **Rejection Notice Banner on Details Page**: Prominent warning banner on the instrument detail view informing viewers of the statutory rejection grounds and instructions for resubmitting rectified documents.

* **Deduplication of Document Viewers**:
  - Eliminated the redundant inline `(view document)` text link in the RVO verification queue, consolidating document inspection under the primary, prominent **`Inspect FDR Scan`** button with the `Eye` icon and full modal preview (`DocumentViewerModal.tsx`).

* **Session Awareness & Seamless Dashboard Navigation**:
  - **Smart Session Awareness**: Unauthenticated visitors see direct "Institution Login" & "Officer Login" options on the landing page, while authenticated users receive "Resume Session" / "Go to Dashboard" without false redirects.
  - **Session-Preserving "Back to Dashboard"**: Replaced hardcoded links with role-aware routing (`/institution/dashboard`, `/officer/dashboard`, or `/admin/dashboard`) and history preservation, preventing accidental sign-outs when navigating back from instrument detail pages.

* **Dual-Model Groq AI Configuration (`GROQ_CHAT_MODEL` & `GROQ_OCR_MODEL`)**:
  - **Environment-Level Model Selection**: Full configuration in `.env.local` to select distinct, optimized models independently for the AI Copilot Assistant and Document OCR Extraction.
  - **Conversational Copilot Engine (`GROQ_CHAT_MODEL`)**: Defaulted to `openai/gpt-oss-120b` (Flagship 120B reasoning model with 131,072 context window for deep statutory, APH, and regulatory reasoning). Also supports `qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, or `llama-3.3-70b-versatile`.
  - **Optical Document OCR Engine (`GROQ_OCR_MODEL`)**: Defaulted to `qwen/qwen3.8-27b` (Ultra-fast 400ms high-throughput model specialized for structured JSON extraction and parsing). Also supports `openai/gpt-oss-120b` or `openai/gpt-oss-20b`.
  - **Automatic Fallback Chain**: If a selected model experiences rate limiting or restrictions, the gateway cascades through alternative candidates before engaging the autonomous local role-memory engine.
  - **Live Configuration Route (`/api/ai/config`)**: Exposes configured active models and diagnostic telemetry to client interfaces.

* **AICTE Regulatory Copilot (Groq AI Chatbot with Role-Specific Memory Access)**:
  - Replaced the fixed single-turn block with an interactive, floating & dockable **Conversational Chatbot Assistant** (`AiChatbot.tsx`).
  - Integrated with **Groq AI** for ultra-fast, contextual statutory assistance, with dynamic model badges in the header and message bubbles.
  - **Strict Role-Specific Memory Isolation & Zero Cross-Data Leakage**:
    - **Technical Institutions**: Strictly bounded to their own college's instruments, maturity dates, and release requests. Inquiries probing other colleges, internal officer review queues, or admin logs are blocked with explicit statutory privacy denials.
    - **Regional Verification Officers (Tier-1)**: Restricted strictly to their assigned region's intake queue, OCR discrepancy forensics, and document verification checks. Cross-region inquiries are rejected under jurisdictional boundary controls.
    - **Regional Finance Officers (Tier-2)**: Restricted strictly to their assigned region's verified active deposit volume, bank distribution, and Tier-2 lien release endorsements.
    - **Regulation Bureau Heads**: Restricted to executive release NOC sanction, high-risk discrepancy appeals, and regional compliance velocity.
    - **Central Compliance Officers**: Authorized for national cross-regional duplicate FDR number collisions, bank concentration exposure, and low-trust institution forensics.
    - **Super Administrators**: Focused on SHA-256 Merkle audit chain integrity proofs, database sync telemetry, and officer MFA compliance audits.
  - Features multi-turn conversation memory, live streaming typing indicator, role-tailored prompt chips, floating interactive chatbot drawer, and 1-click access from the main navigation bar.

* **FDR Document Upload with File Size Limit & Groq AI OCR Auto-Fill**:
  - **File Upload & Size Limit**: Technical institutions can upload scanned FDR certificates (`.pdf`, `.png`, `.jpg`, `.jpeg`) with strict client and server-side **5 MB file size limit** enforcement.
  - **Groq AI OCR Auto-Fill**: Uploaded documents are automatically analyzed by Groq AI OCR to extract bank name, FDR receipt number, principal amount, issue date, maturity date, and joint lien title, auto-populating the form fields.
  - **Manual Review & Failure Fallback**: Institutions can manually verify and edit any auto-populated value. If the OCR engine cannot extract all fields with certainty, the portal prompts the user to enter the details manually and proceed with submission.
  - **Universal Document Viewer (`DocumentViewerModal.tsx`)**: Uploaded documents are securely attached to the instrument and are viewable in-browser with download capabilities by **both the Technical Institution** (via dashboard and detail pages) and **Regional Officers** (directly in the Verification Queue side-by-side diff viewer and inspection console).

* **Dedicated Authentication Gateways (No Hero Popup)**:
  - Replaced the homepage modal popup with dedicated, role-specific portals:
    - **Technical Institutions Portal (`/login/institution`)**: Streamlined 1-step direct authentication for colleges & polytechnics with institution guidance cards.
    - **Regulatory Officers Directorate (`/login/officer`)**: Enforces mandatory **2-Step TOTP Multi-Factor Authentication (MFA)** for official `@aicte.gov.in` accounts.
    - **Central Dual-Portal Gateway (`/login`)**: Displays an authoritative choice interface upon signing out or accessing protected routes directly.

* **Dedicated Role-Scoped Notification Architecture**:
  - Replaced shared generic notifications with strictly isolated, role-specific notification desks with priority tiering, category tags, quick filters (`All`, `Action Required`, `Unread`), and deep action links.

* **Live Supabase PostgreSQL Cloud Integration**:
  - Connected directly to live Supabase Cloud PostgreSQL with connection pooling, automatic schema fallback, and real-time live connection telemetry in the top navigation bar.

---

## 🔄 End-to-End Workflow

<div align="center">
  <img
    src="resource/Workflow_image.png"
    alt="workflow"
    width="100%"
  />
</div>

The portal digitizes and automates the complete multi-year lifecycle of an educational institution's security deposit across 7 structured phases:

```mermaid
flowchart TD
    subgraph Intake["1. Intake & AI Document Intelligence"]
        A[Institution Registrar] -->|Uploads Scanned Certificate <= 5MB| B[Groq AI OCR Extraction Engine]
        B -->|Auto-Extracts Fields & Validates| C[Side-by-Side Discrepancy Engine]
        C -->|Discrepancy Detected?| D{Anomaly Flag?}
        D -->|Yes: Shortfall/Mismatched Date| E[Flagged Queue: High/Med Risk]
        D -->|No: Clean Match| F[Clean Intake Queue]
    end

    subgraph Verification["2. Tier-1 Regional Intake Verification & Rejection"]
        E & F --> G[Regional Verification Officer - RVO]
        G -->|Inspects FDR Scan & Diff| H{Officer Decision}
        H -->|Reject with Notes| I[Status: Rejected • High Risk Alert • Discrepancy Memo to College]
        H -->|Verify Certificate| J[Status: Verified & Joint Lien Endorsed]
    end

    subgraph Finance["3. Tier-2 Financial Audit & Bank Endorsement"]
        J --> K[Regional Finance Officer - RFO]
        K -->|Reconciles Bank Confirmation Letter| L{Finance Audit}
        L -->|Deficiency Found| M[Deficiency Memo Issued to College]
        L -->|Confirm Financial Lien| N[Status: Active Custody in SHA-256 Ledger]
    end

    subgraph Custody["4. Active Custody & Scheduled Monitoring"]
        N --> O[PostgreSQL Scheduled Maturity Monitor]
        O -->|30 / 20 / 15 Days to Maturity| P[Automated In-App & Email Alerts]
        P --> Q{Institution Action}
        Q -->|Renew Deposit| R[Renewal Chain Tree: Parent-Child Lineage]
        Q -->|Maturity Reached| S[Eligible for Release Request]
    end

    subgraph Release["5. Release Audit & Digital NOC"]
        S --> T[Institution Submits Release Request]
        T --> U[Regional Finance Officer - RFO Audit]
        U -->|Complies with Lock-in| V[Regulation Bureau Head - Executive Sign-Off]
        V -->|Digitally Authorize| W[Generate RSA-2048 Signed PDF Release NOC]
    end

    subgraph Settlement["6. Bank Settlement & Refund Confirmation"]
        W --> X[Issuing Bank Credits Funds to Institution]
        X --> Y[Institution Uploads Bank Credit Advice / UTR]
        Y --> Z[Finance Officer Confirms Refund in Ledger]
        Z --> AA[Lifecycle Closed & Archived]
    end

    subgraph Governance["7. Central Compliance & System Security"]
        AB[Central Compliance Officer] -->|Cross-Regional Pattern Detection| AC[Statutory Show-Cause Directives]
        AD[Super Admin - IT Root] -->|Provisions Officers & Enforces TOTP MFA| AE[Security Console]
        AD -->|Mathematical Genesis Hash Verification| AF[SHA-256 Ledger Audit Proof]
        AD -.->|Separation of Duties: Barred HTTP 403| G
        AD -.->|Separation of Duties: Barred HTTP 403| K
    end
```

---

## 🏛️ Technical Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENT TIER (Next.js 16)                      │
│   App Router • TypeScript • Tailwind CSS v4 • Recharts • jsPDF • Lucide  │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │ (institution)    │  │ (officer)        │  │ (admin)                 │ │
│  │ Self-Service FDR │  │ Regional RVO &   │  │ Central Compliance &    │ │
│  │ Submission, Tree │  │ RFO Workbenches  │  │ Super Admin Console     │ │
│  └─────────┬────────┘  └─────────┬────────┘  └────────────┬────────────┘ │
│            │                     │                        │              │
│            ▼                     ▼                        ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Shared UI Components: AiChatbot (Groq AI) • DocumentViewerModal │    │
│  │  Skeleton • Navbar • StatusBadge • RenewalChainTree • Command    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└────────────┼─────────────────────┼────────────────────────┼──────────────┘
             │                     │                        │
             ▼                     ▼                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      BACKEND & API ROUTE HANDLERS                        │
│   /api/instruments • /api/release • /api/audit • /api/cron • /api/auth   │
│   /api/instruments/[id]/verify • /api/instruments/[id]/reject            │
│   /api/ai/query • /api/ai/ocr • /api/ai/config                           │
│                                                                          │
│  ┌──────────────────────────────┐     ┌───────────────────────────────┐  │
│  │ Role-Based Access Control    │     │ Separation of Duties (SoD)    │  │
│  │ (lib/auth/rbac.ts)           │     │ Super Admin 403 Hard Barrier  │  │
│  └──────────────┬───────────────┘     └───────────────┬───────────────┘  │
│                 │                                     │                  │
│  ┌──────────────┴───────────────┐     ┌───────────────┴───────────────┐  │
│  │ Role-Scoped Notifications    │     │ Dedicated Auth Gateways       │  │
│  │ (/api/notifications)         │     │ (/login/institution, officer) │  │
│  └──────────────┬───────────────┘     └───────────────┬───────────────┘  │
└─────────────────┼─────────────────────────────────────┼──────────────────┘
                  │                                     │
                  ▼                                     ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────┐
│      DATABASE & SECURITY LAYER       │  │       GROQ AI & OCR CLOUD      │
│   Supabase Live Cloud PostgreSQL 15  │  │   High-Speed LPU Inference     │
│                                      │  │                                │
│ • Row Level Security (RLS) on all 7  │  │ • Chat: openai/gpt-oss-120b    │
│   tables: Region & Role Scoped       │  │   Role-isolated statutory copilot│
│ • SHA-256 Tamper-Evident Hash Chain  │  │ • OCR: qwen/qwen3.8-27b        │
│   (lib/audit.ts - zero tampering)    │  │   Structured document JSON     │
│ • pg_cron Scheduled Maturity Alerts  │  │ • Live Config: /api/ai/config  │
│ • S3-Compatible Encrypted Vault      │  │ • Automatic Fallback Cascades  │
└──────────────────────────────────────┘  └────────────────────────────────┘
```

---

## 👥 User Roles & Feature Breakdown

The portal defines **6 distinct user roles**, each mapped to specific statutory and operational responsibilities under the AICTE Approval Process Handbook (APH):

| User Role | Persona Example | Geographic Jurisdiction | Core Responsibility |
| :--- | :--- | :--- | :--- |
| **Technical Institution** (`institution`) | Dr. Sachin Joshi (Registrar, VJTI Mumbai) | Single College (`institution_id`) | Submits FDRs with Groq OCR auto-fill, tracks status, views uploaded documents, initiates chained renewals, requests release NOCs, uploads refund credit proof. |
| **Regional Verification Officer** (`regional_verification_officer`) | Shri Rajesh Patil (WRO Mumbai) | Regional Office (`region_id`) | Tier-1 intake gatekeeper: inspects uploaded scans, reviews OCR discrepancy diffs, verifies joint lien clause, executes **Statutory Rejections with discrepancy notices**. |
| **Regional Finance Officer** (`regional_finance_officer`) | Smt. Kavita Sharma (WRO Mumbai) | Regional Office (`region_id`) | Tier-2 financial auditor: reconciles bank confirmation advice, performs lock-in compliance audit, issues digitally signed NOCs. |
| **Regulation Bureau Head** (`regulation_bureau_head`) | Prof. Anil Sahasrabudhe (Bureau Head) | Central / Regional Jurisdiction | Tier-3 executive authority: signs release authorizations, resolves institutional appeals against rejections, monitors regional compliance velocity. |
| **Central Compliance Officer** (`central_compliance_officer`) | Smt. Preeti Deshmukh (Central Ombudsman) | Pan-India (All Regional Offices) | National vigilance: detects duplicate FDR receipt numbers across regions, flags unscheduled banks, issues statutory show-cause notices. |
| **Super Administrator** (`super_admin`) | Dr. Ramesh Kumar (IT Root Architect) | System Infrastructure | IT governance: provisions officer accounts, enforces mandatory TOTP MFA, verifies cryptographic SHA-256 ledger integrity. *(Prohibited from verifying/rejecting FDRs)*. |

---

## 🛡️ Regional Officer FDR Verification & Rejection System

The intake verification stage enforces strict legal accountability for all incoming security deposits:

### 1. Verification Flow (`/api/instruments/[id]/verify`)
* Executed by Regional Verification Officers (Tier 1) and Bureau Heads (Tier 3).
* Verifies declared values against the scanned bank certificate.
* Automatically marks instrument status as **Active & Verified**, writes to live PostgreSQL, records officer notes in `verification_records`, and issues a `VERIFICATION_SUCCESS` notification to the college.
* Generates a cryptographically signed SHA-256 entry in the immutable audit ledger.

### 2. Rejection Flow (`/api/instruments/[id]/reject`)
* When document discrepancies, expired terms, invalid banks, or missing joint lien endorsements are detected:
  1. The officer clicks **Reject FDR** on the queue card.
  2. The **FDR Rejection Modal** opens, offering quick-select preset statutory discrepancy chips:
     - *Amount mismatch between declared values and scanned document*
     - *Maturity date does not satisfy AICTE mandatory lock-in period*
     - *FDR not issued in joint favor of AICTE as required by regulations*
     - *Scanned document is illegible or missing bank stamp/signature*
     - *Invalid bank branch or unrecognized scheduled commercial bank*
  3. The officer enters required statutory remarks and confirms rejection.
  4. The backend:
     - Sets instrument status to **`rejected`**.
     - Flags instrument with **`HIGH_RISK`** severity and saves `discrepancy_notes`.
     - Appends an immutable SHA-256 block (`REJECT_INSTRUMENT`) with officer ID and reason.
     - Dispatches a critical **`VERIFICATION_REJECTED`** notification to the institution.
  5. The institution's dashboard and instrument inspection views display an official **Rejection Notice Banner** prompting rectification and resubmission.

---

## 🤖 Dual-Model Groq AI Architecture (Assistant & OCR)

The portal utilizes Groq's high-speed LPU inference engine with distinct, specialized models configured via environment variables:

```env
# .env.local Configuration
GROQ_API_KEY=gsk_...
GROQ_CHAT_MODEL=openai/gpt-oss-120b
GROQ_OCR_MODEL=qwen/qwen3.8-27b
```

### 1. Conversational AI Assistant (`AiChatbot.tsx` • `openai/gpt-oss-120b`)
* Dockable and floating chatbot available throughout the portal with one-click navbar toggle.
* Powered by the flagship 120B parameter reasoning model with a 131,072 context window for deep statutory analysis under the AICTE Approval Process Handbook (APH).
* **Strict Role Memory Boundary**:
  - Technical Institutions can only query their own college's deposit records.
  - Officers can only query data within their authorized regional or national jurisdiction.
  - Cross-role probing queries receive statutory privacy denials.

### 2. Document OCR Engine (`/api/ai/ocr` • `qwen/qwen3.8-27b`)
* High-throughput 400ms inference model optimized for structured JSON extraction.
* Analyzes uploaded PDF or image scans of Fixed Deposit Receipts.
* Extracts bank name, FDR receipt number, principal amount, issue date, maturity date, and AICTE joint lien endorsement.
* Automatically populates the New FDR submission form with full manual override capabilities.

---

## 🔔 Dedicated Role-Scoped Notification System

| Role | Dedicated Notification Desk | Scoped Alerts & Work Items | Action Triggers |
| :--- | :--- | :--- | :--- |
| **Institution** | **Technical Institution Portal Desk** | Upcoming FDR maturities (30/20/15 days), Regional Office verification approval, **FDR Rejection notices**, Release NOC ready for encashment. | `Initiate Rollover`<br>`View Certificate`<br>`Upload Settlement Proof` |
| **Verification Officer (RVO)** | **Regional Document Verification Queue** | High-risk OCR discrepancy flags, new submissions pending Tier-1 review in their region, missing joint lien clauses. | `Inspect FDR Scan`<br>`Verify & Activate`<br>`Reject FDR` |
| **Finance Officer (RFO)** | **Regional Financial Audit & Lien Desk** | Tier-2 financial endorsement pending, security deposit release clearance requests, bank confirmation letter reconciliations. | `Review & Endorse Lien`<br>`Audit Financial Lock-in`<br>`View Bank Advice` |
| **Bureau Head** | **Regulation Bureau Executive Notices** | Final executive release sign-offs, statutory compliance default alerts (>30 days expired), quarterly regional audit reports. | `Sign Release Certificate`<br>`Review Breaches`<br>`View Executive Summary` |
| **Central Compliance** | **National Compliance & Anti-Fraud Desk** | Cross-regional duplicate FDR numbers, non-scheduled cooperative bank flags, national active endowment health index. | `Launch Fraud Inquiry`<br>`Verify Bank Eligibility`<br>`View National Statistics` |
| **Super Admin** | **System Infrastructure & Security Console** | SHA-256 genesis hash chain mathematical verification, Supabase live cloud replication health, officer MFA enrollment access events. | `Run Proof Verification`<br>`Inspect DB Replication`<br>`Review Security Event` |

---

## 🤝 Checks & Balances: Separation of Duties (SoD)

The portal strictly enforces multi-tier governance to prevent unilateral control or internal fraud:

```
                      ┌────────────────────────┐
                      │      SUPER ADMIN       │
                      │  IT & Key Provisioning │
                      └───────────┬────────────┘
                                  │ Prohibits Operational Verification/Rejection (HTTP 403)
                                  ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   RVO (Tier 1)   │───▶│   RFO (Tier 2)   │───▶│ BUREAU HEAD (T3) │
│  Validates Ground│    │  Audits Finance  │    │  Executive Sign- │
│  Truth & Stamp   │    │  & Bank Guarantee│    │  Off & Appeals   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         ▲                                                ▲
         │                                                │
         └───────────── National Cross-Regional ──────────┘
                       Vigilance & Show-Cause
                                  │
                      ┌───────────┴────────────┐
                      │   CENTRAL COMPLIANCE   │
                      │  Pan-India Ombudsman   │
                      └────────────────────────┘
```

1. **The Four-Eyes Principle (RVO vs RFO)**:
   - The Verification Officer (Tier 1) validates the authenticity of physical deposits, ground-truth OCR diffs, and executes rejections. The RVO cannot approve a fund release.
   - The Finance Officer (Tier 2) audits bank lien releases and financial clearances when deposits mature. The RFO cannot stamp ground-truth certificates without prior RVO intake verification.
2. **Executive Administrative Oversight (Bureau Head)**:
   - Adjudicates institutional appeals against contested rejections, resolves deadlocks, and provides the final digital signature on Release NOCs.
3. **Cross-Regional Vigilance (Central Compliance)**:
   - Regional officers are restricted to their regional boundary. Central Compliance scans cross-regional records to detect duplicate FDR receipt numbers and blacklisted banking institutions.
4. **Zero-Trust IT Administration (Super Admin HTTP 403 Barrier)**:
   - Super Administrators are **explicitly blocked at code and API level (`HTTP 403 Forbidden`)** from verifying or rejecting FDRs, or approving payouts. They maintain servers and audit cryptography, but cannot manipulate transactions.
5. **Cryptographic SHA-256 Ledger Immutability**:
   - Every verification, rejection, endorsement, decision, and notice is chained using `entry_hash = SHA256(prev_hash + actor_id + event + payload + timestamp)`. Altering a single database record breaks the mathematical chain.

---

## 🔐 Production Authentication & Dedicated Gateways

The portal features dedicated, production-ready sign-in routes with zero popup modals:

### Dedicated Access URLs:
* **Institution Portal Sign-In**: [http://localhost:3000/login/institution](http://localhost:3000/login/institution)
* **Regulatory Officer Sign-In**: [http://localhost:3000/login/officer](http://localhost:3000/login/officer)
* **Central Dual-Portal Gateway**: [http://localhost:3000/login](http://localhost:3000/login)
* **Public FDR Verification Search**: [http://localhost:3000/#public-search](http://localhost:3000/#public-search)

### Official Test Credentials

All seed accounts use the standard portal password: `aicte@password123`

| Role | Portal | Official Email (or Alias) | Verification Flow | Target Dashboard |
| :--- | :--- | :--- | :--- | :--- |
| **Technical Institution** | Institution Portal | `admin@vjti.ac.in`<br>*(alias: `accounts@vjti.ac.in`)* | Direct Password | `/institution/dashboard` |
| **Verification Officer (RVO)** | Officer Portal | `rvo.mumbai@aicte.gov.in`<br>*(alias: `patil@aicte.gov.in`)* | Password + TOTP (`123456`) | `/officer/dashboard` |
| **Finance Officer (RFO)** | Officer Portal | `rfo.mumbai@aicte.gov.in`<br>*(alias: `sharma@aicte.gov.in`)* | Password + TOTP (`123456`) | `/officer/dashboard` |
| **Regulation Bureau Head** | Officer Portal | `bureau.head@aicte.gov.in`<br>*(alias: `sahasrabudhe@aicte.gov.in`)* | Password + TOTP (`123456`) | `/officer/dashboard` |
| **Central Compliance** | Officer Portal | `compliance@aicte.gov.in` | Password + TOTP (`123456`) | `/admin/dashboard` |
| **Super Administrator** | Officer Portal | `superadmin@aicte.gov.in`<br>*(alias: `admin@aicte.gov.in`)* | Password + TOTP (`123456`) | `/admin/dashboard` |

> [!NOTE]
> Regulatory Officer sign-in enforces 2-Step TOTP MFA. In local/evaluation mode, any valid 6-digit TOTP code (e.g., `123456`) is accepted.

---

## 🌟 Key Innovations & Differentiators

1. **Dual-Model Groq AI Architecture**: Independent, optimized models for Conversational Copilot Reasoning (`openai/gpt-oss-120b`) and Document OCR Intelligence (`qwen/qwen3.8-27b`).
2. **Full Intake Verification & Statutory Rejection**: Two-click rejection workflow with preset discrepancy chips, audit ledger recording, and instant institution alerts.
3. **Universal In-Browser Document Inspection**: Side-by-side OCR diff and full document viewer (`DocumentViewerModal.tsx`) available to both institutions and regional verification officers.
4. **Dedicated Role-Scoped Notification Desks**: Isolated, work-specific notification streams with priority badges, work category tags, and direct 1-click execution links.
5. **Cryptographic SHA-256 Tamper-Evident Ledger**: Append-only hash chain mathematically validating that no records were altered post-approval.
6. **Digitally Signed PDF Release Certificates**: Automated generation of tamper-evident PDF NOCs containing cryptographic SHA-256 verification hashes.
7. **Parent-Child Renewal Lineage**: Interactive tree component showing the genealogical history of an initial endowment across multi-year rollovers.
8. **Algorithmic Institutional Trust Scoring**: Dynamic trust score (0–100) computed based on document completeness, verification history, and discrepancy frequency.
9. **Automated Scheduled Reminders**: 30, 20, 15, and 7-day countdown alerts ensuring deposits are renewed before lapsing.
10. **Zero-Trust Separation of Duties**: Super Admins explicitly blocked via `HTTP 403` from executing verification or rejection actions.

---

## 🚀 Getting Started & Local Execution

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (tested on Node v20.x and v22.x)
- **npm**: v10.0.0 or later

### 2. Environment Configuration
Create `apps/web/.env.local` (or modify root `.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:<password>@<db-host>:5432/postgres

# Groq AI Configuration
GROQ_API_KEY=gsk_<your-groq-api-key>
GROQ_CHAT_MODEL=openai/gpt-oss-120b
GROQ_OCR_MODEL=qwen/qwen3.8-27b
```

### 3. Running the Web Application
```bash
# Navigate to the web application directory
cd apps/web

# Install dependencies (if not already installed)
npm install

# Start the Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Running the Automated Security Test Suite
Verify Separation of Duties, cryptographic hash chaining, and multi-role scoping:
```bash
cd apps/web
npx tsx test-security.mjs
```
*Output: 5/5 automated security and cryptographic tests passed.*

### 5. Running the Python AI Microservice (Optional)
```bash
cd apps/ai-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 📂 Repository Structure

```
aicte-fdr-portal/
├── apps/
│   ├── web/                         # Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
│   │   ├── app/
│   │   │   ├── (auth)/login/        # Central Dual-Portal Gateway (/login)
│   │   │   │   ├── institution/     # Dedicated Technical Institution Sign-In (/login/institution)
│   │   │   │   └── officer/         # Dedicated Regulatory Officer MFA Sign-In (/login/officer)
│   │   │   ├── (institution)/       # Technical Institution Self-Service Dashboard
│   │   │   ├── (officer)/           # Regional Officer RVO & RFO Workbenches
│   │   │   ├── (admin)/             # Central Compliance & Super Admin Dashboards
│   │   │   ├── instruments/[id]/    # Deep Instrument View (Genealogy Tree, Rejection Banner, NOC)
│   │   │   ├── page.tsx             # Public Landing Page & FDR Verification Search
│   │   │   └── api/                 # API Route Handlers
│   │   │       ├── instruments/     # FDR CRUD & search
│   │   │       │   └── [id]/
│   │   │       │       ├── verify/  # Officer verification & activation
│   │   │       │       ├── reject/  # Officer statutory FDR rejection
│   │   │       │       ├── renew/   # Linked instrument renewal chain
│   │   │       │       └── release/ # Release NOC request & decision
│   │   │       ├── ai/
│   │   │       │   ├── query/       # Groq AI Copilot Chatbot (Role-Isolated Memory)
│   │   │       │   ├── ocr/         # Groq AI Document OCR Auto-Fill
│   │   │       │   └── config/      # Live AI Model Configuration & Health
│   │   │       ├── notifications/   # Role-scoped notification desk
│   │   │       ├── audit/           # SHA-256 Merkle chain verification
│   │   │       └── cron/maturity/   # Scheduled maturity countdown engine
│   │   ├── components/              # UI Components
│   │   │   ├── AiChatbot.tsx        # Conversational Groq AI Copilot Assistant
│   │   │   ├── DocumentViewerModal.tsx # Universal In-Browser Document Viewer
│   │   │   ├── Navbar.tsx           # Session-aware nav, desk notifications & connection indicator
│   │   │   ├── RenewalChainTree.tsx # Interactive multi-year endowment genealogy
│   │   │   ├── Skeleton.tsx         # Zero-content-shift skeleton loaders
│   │   │   └── StatusBadge.tsx      # Multi-status regulatory pill badges
│   │   ├── lib/
│   │   │   ├── audit.ts             # SHA-256 Tamper-evident hash chain engine
│   │   │   ├── auth/rbac.ts         # Separation of Duties & route guards
│   │   │   └── supabase/            # Store, Types, DB Pool & Seed Data
│   │   ├── middleware.ts            # Route guards, public login routes & role redirects
│   │   └── test-security.mjs        # Automated security test runner
│   └── ai-service/                  # Python FastAPI Microservice
│       ├── main.py                  # Endpoints for OCR, discrepancy, and query
│       ├── ocr.py                   # Tesseract/Pillow OCR field extraction
│       ├── discrepancy.py           # Anomaly reasoning engine
│       ├── query_agent.py           # Conversational AI assistant
│       └── requirements.txt         # Python dependencies
├── supabase/
│   ├── migrations/                  # Complete SQL migrations with Row Level Security (RLS)
│   │   ├── 0001_init.sql            # Core tables, constraints, enums
│   │   ├── 0002_rls_policies.sql    # Role & Region RLS access policies
│   │   ├── 0003_storage_policies.sql# Storage bucket RLS policies
│   │   └── 0004_cron_and_functions.sql # pg_cron scheduled jobs & audit verification
│   └── seed.sql                     # Seed data: 4 regions, 6 banks, 10 institutions, 30+ FDRs
├── progress.md                      # Milestone & phase completion tracker
└── README.md                        # Architectural specification & project documentation
```

---

## 🏛️ Production Deployment & System Verification
The portal is fully operational and production-deployable. All core features—including AI OCR intake, two-tier regional verification, statutory rejection workflows, live Supabase Cloud database persistence, cryptographic SHA-256 hash chaining, dedicated authentication portals, role-isolated conversational AI, and role-scoped notification systems—are active.

To verify system security and cryptographic integrity at any time, run:
```bash
cd apps/web
npx tsx test-security.mjs
```
*Output: 5/5 automated security and cryptographic tests passed.*

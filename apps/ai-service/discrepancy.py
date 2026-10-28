"""
Discrepancy & Risk Reasoning Engine for AICTE FDR Verification
Compares institution-declared values against OCR-extracted ground truth
"""
from typing import Dict, Any, List
import os

def analyze_discrepancy(submitted: Dict[str, Any], ocr: Dict[str, Any], history: Dict[str, Any] = None) -> Dict[str, Any]:
    discrepancies: List[Dict[str, Any]] = []
    flags: List[str] = []
    risk_level = "CLEAN"

    # 1. Amount Check
    sub_amt = float(submitted.get("amount") or 0)
    ocr_amt = float(ocr.get("amount") or 0)
    if ocr_amt > 0 and abs(sub_amt - ocr_amt) > 1.0:
        discrepancies.append({
            "field": "amount",
            "submitted": sub_amt,
            "ocr_extracted": ocr_amt,
            "diff_amount": sub_amt - ocr_amt,
            "severity": "CRITICAL"
        })
        flags.append(f"Amount mismatch: Institution declared ₹{sub_amt:,.2f} but document indicates ₹{ocr_amt:,.2f}.")
        risk_level = "HIGH_RISK"

    # 2. FDR Number Check
    sub_fdr = str(submitted.get("fdr_number") or "").strip().upper()
    ocr_fdr = str(ocr.get("fdr_number") or "").strip().upper()
    if ocr_fdr and sub_fdr and sub_fdr != ocr_fdr:
        discrepancies.append({
            "field": "fdr_number",
            "submitted": sub_fdr,
            "ocr_extracted": ocr_fdr,
            "severity": "HIGH"
        })
        flags.append(f"FDR Number mismatch: Declared '{sub_fdr}' vs document '{ocr_fdr}'.")
        if risk_level != "HIGH_RISK":
            risk_level = "MEDIUM_RISK"

    # 3. Bank Name Check
    sub_bank = str(submitted.get("bank_name") or "").strip().lower()
    ocr_bank = str(ocr.get("bank_name") or "").strip().lower()
    if ocr_bank and sub_bank and sub_bank not in ocr_bank and ocr_bank not in sub_bank:
        discrepancies.append({
            "field": "bank_name",
            "submitted": submitted.get("bank_name"),
            "ocr_extracted": ocr.get("bank_name"),
            "severity": "HIGH"
        })
        flags.append(f"Issuing Bank mismatch: Declared '{submitted.get('bank_name')}' vs document '{ocr.get('bank_name')}'.")
        if risk_level != "HIGH_RISK":
            risk_level = "MEDIUM_RISK"

    # 4. Maturity Date Check
    sub_mat = str(submitted.get("maturity_date") or "").strip()
    ocr_mat = str(ocr.get("maturity_date") or "").strip()
    if ocr_mat and sub_mat and sub_mat != ocr_mat:
        discrepancies.append({
            "field": "maturity_date",
            "submitted": sub_mat,
            "ocr_extracted": ocr_mat,
            "severity": "MEDIUM"
        })
        flags.append(f"Maturity Date discrepancy: Declared '{sub_mat}' vs document '{ocr_mat}'.")
        if risk_level == "CLEAN":
            risk_level = "LOW_RISK"

    # Natural language summary explanation
    if not discrepancies:
        summary_explanation = "All key financial and identifying parameters (Bank, FDR Number, Principal Amount, and Maturity Schedule) match the uploaded scanned instrument with high confidence."
    else:
        summary_explanation = (
            f"AI Verification Alert: Identified {len(discrepancies)} discrepancy/discrepancies requiring officer intervention. "
            + " ".join(flags)
            + " Recommended action: Flag for clarification or request updated bank verification."
        )

    # Historical factor (if provided)
    past_flagged_count = history.get("past_flagged_count", 0) if history else 0
    if past_flagged_count > 0:
        summary_explanation += f" Note: This institution has {past_flagged_count} prior flagged instruments on record."

    return {
        "flagged": len(discrepancies) > 0,
        "risk_level": risk_level,
        "discrepancies": discrepancies,
        "explanation": summary_explanation,
        "checked_fields_count": 4,
        "matched_fields_count": 4 - len(discrepancies)
    }

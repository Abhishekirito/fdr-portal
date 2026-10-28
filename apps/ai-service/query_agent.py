"""
Natural Language Query Agent for AICTE FDR Portal
Interprets plain English queries and maps them to safe, parameterized analytical intents.
"""
import re
from typing import Dict, Any, List

def process_natural_query(query: str, context_data: Dict[str, Any] = None) -> Dict[str, Any]:
    q = query.lower().strip()
    
    intent = "general"
    parameters = {}
    answer = ""
    suggested_chart = None

    # Detect Region if mentioned
    regions = ["mumbai", "delhi", "bangalore", "kolkata", "chennai", "bhopal", "chandigarh", "hyderabad", "kanpur"]
    matched_region = None
    for r in regions:
        if r in q:
            matched_region = r.capitalize()
            parameters["region"] = matched_region
            break

    # Intent 1: Expiry in N days
    if "expire" in q or "maturity" in q or "due" in q or "expiring" in q:
        intent = "expiring_fdrs"
        days = 30
        day_match = re.search(r"(\d+)\s*days?", q)
        if day_match:
            days = int(day_match.group(1))
        parameters["days"] = days
        
        region_str = f" in {matched_region} region" if matched_region else " across all AICTE regions"
        answer = f"Found FDR instruments maturing within the next {days} days{region_str}. These require monitoring and institutional reminder notices."
        suggested_chart = {
            "type": "bar",
            "xAxis": "maturity_bucket",
            "yAxis": "count",
            "title": f"FDR Expirations within {days} Days"
        }

    # Intent 2: Total deposit volume or amount
    elif "total" in q or "sum" in q or "worth" in q or "deposit value" in q:
        intent = "deposit_summary"
        region_str = f" for {matched_region}" if matched_region else " national total"
        answer = f"Aggregated security deposit calculation{region_str} active across verified financial institutions."
        suggested_chart = {
            "type": "pie",
            "dimension": "bank_name",
            "metric": "amount",
            "title": "Deposit Share by Issuing Bank"
        }

    # Intent 3: Pending verification / release requests
    elif "pending" in q or "queue" in q or "unverified" in q or "verification" in q:
        intent = "pending_cases"
        answer = f"Filtering active workflow queue for pending verification and release requests{f' in {matched_region}' if matched_region else ''}."
        suggested_chart = {
            "type": "bar",
            "xAxis": "status",
            "yAxis": "count",
            "title": "Pending Workload by Case Status"
        }

    # Intent 4: Discrepancies / Flagged cases
    elif "flagged" in q or "discrepancy" in q or "mismatch" in q or "risk" in q:
        intent = "flagged_cases"
        answer = f"Identified instruments with AI or rule-based discrepancy flags requiring officer attention."
        suggested_chart = {
            "type": "donut",
            "dimension": "severity",
            "metric": "count",
            "title": "Flagged Cases by Risk Severity"
        }

    else:
        intent = "search_fdrs"
        answer = f"Searching FDR registry for matching keyword: '{query}'."

    return {
        "query": query,
        "intent": intent,
        "parameters": parameters,
        "text_response": answer,
        "suggested_chart": suggested_chart
    }

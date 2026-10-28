"""
AICTE FDR Portal AI Microservice
FastAPI server handling OCR document extraction, discrepancy analysis, and natural-language queries.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import json
import uvicorn

from ocr import perform_ocr_on_file, extract_fdr_fields_from_text
from discrepancy import analyze_discrepancy
from query_agent import process_natural_query

app = FastAPI(
    title="AICTE FDR Document & Query Intelligence API",
    version="1.0.0",
    description="Microservice providing OCR extraction, risk discrepancy analysis, and analytical query capabilities."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiscrepancyRequest(BaseModel):
    submitted_fields: Dict[str, Any]
    ocr_fields: Dict[str, Any]
    institution_history: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "aicte-fdr-ai-service", "version": "1.0.0"}

@app.post("/ocr/extract")
async def extract_ocr(file: UploadFile = File(None), text_content: Optional[str] = Form(None)):
    """
    Accepts an uploaded FDR scan or raw text string and returns structured metadata.
    """
    if file:
        content = await file.read()
        return perform_ocr_on_file(content, file.filename)
    elif text_content:
        return extract_fdr_fields_from_text(text_content)
    else:
        # Default sample response for testing
        sample_doc = (
            "CANARA BANK - FIXED DEPOSIT RECEIPT\n"
            "Receipt No: FDR-2026-CN-58291\n"
            "Account: Security Deposit AICTE New Delhi\n"
            "Principal Amount: Rs. 20,00,000.00\n"
            "Value Date: 10/02/2024\n"
            "Maturity Date: 10/02/2027\n"
            "Branch: Connaught Place, New Delhi"
        )
        return extract_fdr_fields_from_text(sample_doc)

@app.post("/discrepancy/analyze")
def run_discrepancy_analysis(payload: DiscrepancyRequest):
    """
    Compares institution-declared values with OCR data, outputting risk severity and plain-language explanation.
    """
    return analyze_discrepancy(
        payload.submitted_fields,
        payload.ocr_fields,
        payload.institution_history
    )

@app.post("/query/ask")
def query_portal(payload: QueryRequest):
    """
    Processes natural-language questions from officers and administrators into safe queries and structured results.
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return process_natural_query(payload.query, payload.context)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

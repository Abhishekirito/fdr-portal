import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '');

  const chatModel = (process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b').trim();
  const ocrModel = (process.env.GROQ_OCR_MODEL || 'qwen/qwen3.8-27b').trim();

  return NextResponse.json({
    configured: isConfigured,
    chat_model: chatModel,
    ocr_model: ocrModel,
    available_chat_models: [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
    ],
    available_ocr_models: [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
    ],
  });
}

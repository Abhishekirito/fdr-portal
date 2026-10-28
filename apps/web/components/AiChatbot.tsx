'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Shield,
  Lock,
  ChevronDown,
  Building2,
  FileCheck2,
  AlertTriangle,
  Zap,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Profile } from '@/lib/supabase/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  provider?: string;
}

interface AiChatbotProps {
  initialOpen?: boolean;
}

export function AiChatbot({ initialOpen = false }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [roleTitle, setRoleTitle] = useState<string>('Authorized Official');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('Groq AI');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatModelBadge = (m: string) => {
    if (!m || m.includes('aicte-role') || m.includes('local')) return 'AICTE Local';
    if (m.includes('gpt-oss-120b')) return 'Groq gpt-120b';
    if (m.includes('gpt-oss-20b')) return 'Groq gpt-20b';
    if (m.includes('qwen')) return 'Groq qwen-27b';
    if (m.includes('llama-3.3')) return 'Groq llama-3.3';
    return `Groq ${m.split('/').pop() || m}`;
  };

  // Fetch session profile and AI model configuration on mount
  useEffect(() => {
    fetchSession();
    fetchAiConfig();

    // Listen for custom open event (e.g. from navbar or dashboard action buttons)
    const handleOpenEvent = (e: any) => {
      setIsOpen(true);
      if (e.detail?.query) {
        handleSendMessage(e.detail.query);
      }
    };
    window.addEventListener('open-ai-chat', handleOpenEvent);
    return () => window.removeEventListener('open-ai-chat', handleOpenEvent);
  }, []);

  const fetchAiConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      if (data.chat_model) {
        setActiveModel(data.chat_model);
      }
    } catch {
      // ignore
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.currentProfile) {
        setCurrentProfile(data.currentProfile);
        initializeWelcomeMessage(data.currentProfile);
      }
    } catch (e) {
      console.error('Failed to load session for chatbot', e);
    }
  };

  const initializeWelcomeMessage = (prof: Profile) => {
    const role = prof.role;
    let title = 'Authorized User';
    let place = '';
    let initialSuggestions: string[] = [];

    switch (role) {
      case 'institution':
        title = 'Institution Representative';
        place = prof.institution?.name || 'Your Institution';
        initialSuggestions = [
          'Which of our FDRs are expiring soon?',
          'What is our total active deposit principal?',
          'How do we apply for an FDR lien release NOC?',
          'What are the mandatory AICTE joint lien guidelines?',
        ];
        break;
      case 'regional_verification_officer':
        title = 'Regional Verification Officer (Tier-1)';
        place = prof.region?.name || 'Western Regional Office';
        initialSuggestions = [
          `Show pending intake verification cases in ${place}`,
          'Which FDRs have high-risk OCR discrepancy flags?',
          'What are the mandatory Tier-1 verification checks?',
        ];
        break;
      case 'regional_finance_officer':
        title = 'Regional Finance Officer (Tier-2)';
        place = prof.region?.name || 'Western Regional Office';
        initialSuggestions = [
          `What is the total active deposit principal in ${place}?`,
          'Show release requests pending financial endorsement',
          'Breakdown of deposit volume by issuing bank',
        ];
        break;
      case 'regulation_bureau_head':
        title = 'Regulation Bureau Head';
        place = prof.region?.name || 'National Regulation Bureau';
        initialSuggestions = [
          'How many FDR release NOCs are pending executive sanction?',
          'Summary of high-risk discrepancy appeals',
          'Regional compliance velocity overview',
        ];
        break;
      case 'central_compliance_officer':
        title = 'Central Compliance Officer';
        place = 'National Directorate';
        initialSuggestions = [
          'Check for duplicate FDR serial number collisions nationwide',
          'Identify institutions with high risk and low trust scores',
          'National deposit volume concentration by banking institution',
        ];
        break;
      case 'super_admin':
        title = 'Super Administrator (IT Root)';
        place = 'HQ Security Operations';
        initialSuggestions = [
          'Verify SHA-256 audit log cryptographic chain integrity',
          'Database connection and sync telemetry',
          'Officer MFA compliance audit',
        ];
        break;
      default:
        title = 'Portal Official';
        place = 'AICTE Security Portal';
        initialSuggestions = ['Explain AICTE FDR policies', 'Help with portal navigation'];
    }

    setRoleTitle(title);
    setJurisdiction(place);
    setSuggestions(initialSuggestions);

    const welcomeText = `Namaste **${prof.full_name || 'Official'}**! I am the **AICTE Regulatory Copilot**, powered by **Groq AI** high-speed inference.\n\n` +
      `🛡️ **Active Role Memory:** You are logged in as **${title}** bounded strictly to **${place}**.\n\n` +
      `Under statutory data governance protocols, I can answer your regulatory questions, audit workflows, and FDR queries within your authorized jurisdiction.\n\n` +
      `*How may I assist you today?*`;

    setMessages([
      {
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'Groq AI',
      },
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          profileId: currentProfile?.id,
          query: text,
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const respModel = data.model || activeModel;
        if (data.model) {
          setActiveModel(data.model);
        }
        setMessages([
          ...newHistory,
          {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provider: data.provider === 'groq' ? formatModelBadge(respModel) : 'AICTE Role Engine',
          },
        ]);
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } else {
        setMessages([
          ...newHistory,
          {
            role: 'assistant',
            content: `⚠️ **System Notice**: ${data.error || 'Unable to complete AI query. Please try again.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: '⚠️ **Network Error**: Unable to reach AICTE AI Agent service. Please verify your connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (currentProfile) {
      initializeWelcomeMessage(currentProfile);
    } else {
      setMessages([]);
    }
  };

  // Helper to render bold and bullet points nicely
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={pIdx} className="italic text-slate-600">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={pIdx} className="bg-slate-100 text-indigo-700 font-mono text-[11px] px-1 py-0.5 rounded">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-blue-600 font-bold">•</span>
            <span className="flex-1">{renderedLine}</span>
          </div>
        );
      }
      if (line.trim().length === 0) {
        return <div key={index} className="h-2" />;
      }
      return (
        <p key={index} className="my-0.5 leading-relaxed">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* ============================================================== */}
      {/* FLOATING TRIGGER BUTTON (When closed) */}
      {/* ============================================================== */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-full shadow-2xl border border-blue-400/30 hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
          title="Open AICTE Regulatory Copilot (Groq AI)"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white shadow-inner">
              <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-950 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-tight flex items-center gap-1">
              AICTE Copilot
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-semibold border border-amber-400/30">
                Groq AI
              </span>
            </span>
            <span className="text-[10px] text-blue-200/80 font-medium">Role-Bounded Agent</span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow ml-1" />
        </button>
      )}

      {/* ============================================================== */}
      {/* CHATBOT WINDOW (When opened) */}
      {/* ============================================================== */}
      {isOpen && (
        <div
          className={`fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 ${
            isExpanded
              ? 'w-[calc(100vw-32px)] sm:w-[680px] h-[calc(100vh-64px)] max-h-[780px]'
              : 'w-[calc(100vw-32px)] sm:w-[460px] h-[580px] max-h-[calc(100vh-48px)]'
          }`}
        >
          {/* TOP HEADER */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white flex items-center justify-between border-b border-blue-800/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md ring-1 ring-white/20">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                    AICTE Regulatory Copilot
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    {formatModelBadge(activeModel)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-blue-200/80 truncate max-w-[240px]">
                  <span className="font-semibold text-amber-300">{roleTitle}</span>
                  <span>•</span>
                  <span className="truncate">{jurisdiction}</span>
                </div>
              </div>
            </div>

            {/* Window controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Restart Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ROLE SECURITY ISOLATION PILL BANNER */}
          <div className="px-3.5 py-1.5 bg-blue-50/90 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <Lock className="w-3 h-3 text-blue-700 shrink-0" />
              <span className="truncate">
                {currentProfile?.role === 'institution'
                  ? `Isolated: Solely ${currentProfile?.institution?.name || 'Institution'} records accessible`
                  : `Role Scope: Strictly bounded to ${jurisdiction} review`}
              </span>
            </div>
            <span className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200 font-bold shrink-0">
              Role RBAC Active
            </span>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-slate-200/50'
                  }`}
                >
                  <div className="space-y-1">{renderFormattedMessage(msg.content)}</div>

                  <div
                    className={`mt-2 flex items-center justify-between text-[9px] pt-1 border-t ${
                      msg.role === 'user' ? 'border-white/10 text-blue-200' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp || ''}</span>
                    {msg.provider && (
                      <span className="flex items-center gap-1 font-semibold text-indigo-600">
                        <Zap className="w-2.5 h-2.5" />
                        {msg.provider}
                      </span>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-[11px] font-bold">
                    {currentProfile?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {loading && (
              <div className="flex gap-2.5 justify-start animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Groq Llama-3.3 analyzing statutory repository...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT SUGGESTION CHIPS */}
          {suggestions.length > 0 && !loading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
                Suggested:
              </span>
              {suggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleSendMessage(sug)}
                  className="text-[11px] text-blue-900 hover:text-blue-950 bg-blue-50/80 hover:bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-200/60 transition-colors shrink-0 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>{sug}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-blue-600" />
                </button>
              ))}
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={
                  currentProfile?.role === 'institution'
                    ? 'Ask about your FDRs, maturities, lien rules...'
                    : 'Ask about pending queue, OCR flags, deposit volume...'
                }
                disabled={loading}
                className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="px-3.5 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl font-semibold shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Send query to Groq AI"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-blue-600" />
                AICTE Official Regulation Engine
              </span>
              <span>Encrypted Role-Specific Memory</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

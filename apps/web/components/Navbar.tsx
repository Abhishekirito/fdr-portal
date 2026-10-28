'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Building2,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  LogOut,
  Globe,
  Database,
  CheckCircle2,
  ArrowRight,
  FileCheck2,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { Profile, NotificationRecord } from '@/lib/supabase/types';
import { AiChatbot } from './AiChatbot';

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export function Navbar({ onOpenCommandPalette }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionRequiredCount, setActionRequiredCount] = useState(0);
  const [deskTitle, setDeskTitle] = useState('Official Notifications');
  const [activeFilter, setActiveFilter] = useState<'all' | 'action_required' | 'unread'>('all');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.currentProfile) setCurrentProfile(data.currentProfile);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
      if (typeof data.actionRequiredCount === 'number') setActionRequiredCount(data.actionRequiredCount);
      if (data.deskTitle) setDeskTitle(data.deskTitle);
    } catch (e) {
      // ignore
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aicte_current_profile_id');
      document.cookie = 'aicte_current_profile_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'aicte_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      window.location.href = '/login';
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setActionRequiredCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch (e) {
      // ignore
    }
  };

  const markItemRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      // ignore
    }
  };

  const getDisplayName = () => {
    if (!currentProfile) return 'Loading...';
    if (currentProfile.role === 'institution') return currentProfile.full_name || 'Institution Admin';
    if (currentProfile.role === 'regional_verification_officer') return currentProfile.full_name || 'Verification Officer';
    if (currentProfile.role === 'regional_finance_officer') return currentProfile.full_name || 'Finance Officer';
    if (currentProfile.role === 'regulation_bureau_head') return currentProfile.full_name || 'Bureau Head';
    if (currentProfile.role === 'central_compliance_officer') return 'Central Compliance';
    if (currentProfile.role === 'super_admin') return 'Super Admin (IT Root)';
    return currentProfile.full_name || 'User';
  };

  const getRoleBadgeInfo = () => {
    if (!currentProfile) return { icon: ShieldCheck, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    switch (currentProfile.role) {
      case 'institution':
        return { icon: Building2, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'regional_verification_officer':
        return { icon: FileCheck2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'regional_finance_officer':
        return { icon: Scale, color: 'text-amber-800 bg-amber-50 border-amber-200' };
      case 'regulation_bureau_head':
        return { icon: ShieldCheck, color: 'text-indigo-800 bg-indigo-50 border-indigo-200' };
      case 'central_compliance_officer':
        return { icon: AlertTriangle, color: 'text-rose-800 bg-rose-50 border-rose-200' };
      case 'super_admin':
        return { icon: Lock, color: 'text-purple-800 bg-purple-50 border-purple-200' };
      default:
        return { icon: ShieldCheck, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    }
  };

  const getDashboardUrl = () => {
    if (!currentProfile) return '/';
    if (currentProfile.role === 'institution') return '/institution/dashboard';
    if (currentProfile.role === 'central_compliance_officer' || currentProfile.role === 'super_admin') {
      return '/admin/dashboard';
    }
    return '/officer/dashboard';
  };

  const roleInfo = getRoleBadgeInfo();
  const RoleIcon = roleInfo.icon;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'action_required') return n.priority === 'critical' || n.priority === 'action_required';
    if (activeFilter === 'unread') return n.status === 'unread';
    return true;
  });

  return (
    <>
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Bureau Badge */}
          <div className="flex items-center gap-3">
            <Link href={getDashboardUrl()} className="flex items-center gap-2.5 hover:opacity-90 transition" title="Go to Dashboard">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2b48] to-blue-900 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md border-2 border-amber-400">
                🏛️
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Regulation Bureau
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Govt. of India</span>
                </div>
                <h1 className="text-sm font-black text-slate-900 leading-tight">AICTE Security Deposit Portal</h1>
              </div>
            </Link>
          </div>

          {/* Center/Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Link to Official Public Homepage */}
            <Link
              href="/"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition border border-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-blue-700" />
              <span>Portal Home</span>
            </Link>

            {/* Quick Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-500 font-medium transition cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick Action...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Supabase Live DB Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Cloud Live</span>
            </div>

            {/* AI Copilot Launch Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-ai-chat'));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer ring-1 ring-blue-700/50"
              title="Open AICTE Regulatory Copilot (Groq AI)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">AI Copilot</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hidden md:inline">
                Groq
              </span>
            </button>

            {/* Notifications Bell */}
            <div className="relative" ref={notifMenuRef}>
              <button onClick={() => setShowNotifMenu(!showNotifMenu)}
                className={`relative p-2 rounded-xl transition cursor-pointer ${showNotifMenu ? 'bg-blue-100 text-blue-950 shadow-inner' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                aria-label="Notifications"
                title={`${deskTitle} (${unreadCount} unread)`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dedicated Role Notification Desk Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 dropdown-panel animate-fade-in-up">
                  {/* Role Desk Header */}
                  <div className="pb-3 border-b border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${roleInfo.color}`}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-tight">{deskTitle}</h4>
                          <p className="text-[10px] text-slate-400">Scoped strictly to your authorized role & duties</p>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-bold transition cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeFilter === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        All ({notifications.length})
                      </button>

                      {actionRequiredCount > 0 && (
                        <button
                          onClick={() => setActiveFilter('action_required')}
                          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${activeFilter === 'action_required'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          <span>Action Required ({actionRequiredCount})</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveFilter('unread')}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${activeFilter === 'unread'
                            ? 'bg-blue-700 text-white'
                            : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                          }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-8 text-center space-y-2 text-slate-400">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          There are no active {activeFilter === 'action_required' ? 'pending work action' : ''} notices for your desk at this time.
                        </p>
                      </div>
                    ) : (
                      filteredNotifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl text-xs border transition-all ${n.status === 'unread'
                              ? n.priority === 'critical'
                                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                                : n.priority === 'action_required'
                                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                  : 'bg-blue-50/50 border-blue-200 text-blue-950'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                            }`}
                        >
                          {/* Item Meta & Priority */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              {n.priority === 'critical' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                                  Critical
                                </span>
                              ) : n.priority === 'action_required' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                  Action Required
                                </span>
                              ) : n.priority === 'warning' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                                  Warning
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200/80 text-slate-700">
                                  Notice
                                </span>
                              )}

                              {n.category && (
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                  • {n.category}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(n.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Title & Message */}
                          <h5 className="font-bold text-xs text-slate-900 mt-1">{n.title}</h5>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                          {/* Action Link & Mark Read */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                            {n.action_url ? (
                              <Link
                                href={n.action_url}
                                onClick={() => {
                                  if (n.status === 'unread') markItemRead(n.id);
                                  setShowNotifMenu(false);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-2xs transition hover:scale-[1.02]"
                              >
                                <span>{n.action_label || 'Execute Task'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span />
                            )}

                            {n.status === 'unread' && (
                              <button
                                onClick={e => markItemRead(n.id, e)}
                                className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Official Session / Profile Pill */}
            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <UserCheck className="w-4 h-4 text-blue-700" />
                <span className="hidden sm:inline font-medium text-slate-600">Account:</span>
                <span className="font-bold truncate max-w-[170px]">
                  {getDisplayName()}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-blue-700 transition-transform duration-200 ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile & Account Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 dropdown-panel">
                  {/* Account Header */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{currentProfile?.full_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {currentProfile?.email}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
                        {currentProfile?.role.replace(/_/g, ' ')}
                      </span>
                      {currentProfile?.mfa_enabled && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          TOTP MFA Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer border border-rose-200 btn-press"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sign Out to Official Login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
    <AiChatbot />
    </>
  );
}

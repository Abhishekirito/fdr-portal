import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';
import { NotificationRecord, UserRole } from '@/lib/supabase/types';
import { getDbPool, queryDb } from '@/lib/supabase/db';

const ROLE_DESK_TITLES: Record<UserRole, string> = {
  institution: 'Technical Institution Portal Desk',
  regional_verification_officer: 'Regional Document Verification Queue',
  regional_finance_officer: 'Regional Financial Audit & Lien Desk',
  regulation_bureau_head: 'Regulation Bureau Executive Notices',
  central_compliance_officer: 'National Compliance & Anti-Fraud Desk',
  super_admin: 'System Infrastructure & Security Console',
};

function filterNotificationsForUser(user: any, allNotifications: NotificationRecord[]): NotificationRecord[] {
  if (user.role === 'institution') {
    return allNotifications.filter(n => {
      if (n.user_id && n.user_id === user.id) return true;
      if (n.payload?.institution_id && n.payload.institution_id === user.institution_id) return true;
      if (n.role_target === 'institution' && (!n.payload?.institution_id || n.payload.institution_id === user.institution_id)) return true;
      return false;
    });
  }

  if (user.role === 'regional_verification_officer') {
    return allNotifications.filter(n => {
      if (n.user_id && n.user_id === user.id) return true;
      if (n.role_target === 'regional_verification_officer') {
        return !n.region_id || n.region_id === user.region_id;
      }
      return false;
    });
  }

  if (user.role === 'regional_finance_officer') {
    return allNotifications.filter(n => {
      if (n.user_id && n.user_id === user.id) return true;
      if (n.role_target === 'regional_finance_officer') {
        return !n.region_id || n.region_id === user.region_id;
      }
      return false;
    });
  }

  if (user.role === 'regulation_bureau_head') {
    return allNotifications.filter(n => {
      if (n.user_id && n.user_id === user.id) return true;
      return n.role_target === 'regulation_bureau_head';
    });
  }

  if (user.role === 'central_compliance_officer') {
    return allNotifications.filter(n => {
      if (n.user_id && n.user_id === user.id) return true;
      return n.role_target === 'central_compliance_officer';
    });
  }

  if (user.role === 'super_admin') {
    return allNotifications.filter(n => {
      if (n.user_id && n.user_id === user.id) return true;
      return n.role_target === 'super_admin';
    });
  }

  return [];
}

export async function GET(request: Request) {
  try {
    await dataStore.syncFromDatabase();
    const user = dataStore.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        role: null,
        deskTitle: 'Official Notifications',
        notifications: [],
        unreadCount: 0,
        actionRequiredCount: 0,
      });
    }
    const notifications = filterNotificationsForUser(user, dataStore.notifications);

    const unreadCount = notifications.filter(n => n.status === 'unread').length;
    const actionRequiredCount = notifications.filter(
      n => n.status === 'unread' && (n.priority === 'critical' || n.priority === 'action_required')
    ).length;

    return NextResponse.json({
      role: user.role,
      deskTitle: ROLE_DESK_TITLES[user.role as UserRole] || 'Official Notifications',
      notifications,
      unreadCount,
      actionRequiredCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = dataStore.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { id } = body;

    // Get only the notifications this user is authorized to modify
    const authorizedNotifs = filterNotificationsForUser(user, dataStore.notifications);

    if (id) {
      const target = authorizedNotifs.find(n => n.id === id);
      if (target) {
        target.status = 'read';
        if (getDbPool()) {
          queryDb('update notifications set status = $1 where id = $2', ['read', id]).catch(() => {});
        }
      }
    } else {
      // Mark all read ONLY for this role's notifications
      authorizedNotifs.forEach(n => {
        n.status = 'read';
      });
      if (getDbPool() && authorizedNotifs.length) {
        const ids = authorizedNotifs.map(n => n.id);
        queryDb(`update notifications set status = 'read' where id = any($1)`, [ids]).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


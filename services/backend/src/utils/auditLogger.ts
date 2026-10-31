import { supabase } from '../config/supabase';

export interface AuditLogEntry {
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  affectedCollection?: string;
  affectedDocId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      actor_role: entry.actorRole,
      action: entry.action,
      affected_table: entry.affectedCollection,
      affected_row_id: entry.affectedDocId,
      before_data: entry.before,
      after_data: entry.after,
      ip_address: entry.ipAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}

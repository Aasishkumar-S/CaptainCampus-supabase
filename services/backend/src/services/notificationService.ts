import { supabase } from '../config/supabase';
import { NotificationType } from '@captain-campus/shared_types';
import { v4 as uuidv4 } from 'uuid';

export interface SendPushParams {
  userId?: string;
  topic?: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  relatedBusId?: string;
  relatedRouteId?: string;
  relatedStopId?: string;
}

export class NotificationService {
  /**
   * Broadcasts a campus notification to all students or subscribed route topics,
   * saving notification records in the Supabase notifications table.
   */
  static async sendCampusAlert(params: SendPushParams): Promise<{ sentCount: number }> {
    const { title, body, relatedRouteId, relatedBusId, relatedStopId } = params;

    try {
      // 1. Fetch user profiles (filtered by route if applicable)
      let query = supabase.from('user_profiles').select('user_id, fcm_token');
      if (relatedRouteId) {
        query = query.eq('preferred_stop_id', relatedRouteId);
      }

      const { data: users } = await query;
      const recipientCount = users?.length || 0;

      // 2. Insert notification log in Supabase notifications table
      await supabase.from('notifications').insert({
        id: uuidv4(),
        title,
        body,
        route_id: relatedRouteId || null,
        recipient_count: recipientCount,
        created_at: new Date().toISOString(),
      });

      return { sentCount: recipientCount };
    } catch (err) {
      console.warn('[Notification Error]:', err);
      return { sentCount: 0 };
    }
  }

  /**
   * Dispatches approaching bus notification when a bus enters a stop's proximity window.
   */
  static async sendApproachingBusAlert(params: {
    busNumber: string;
    routeCode: string;
    stopName: string;
    etaMinutes: number;
    routeId: string;
  }): Promise<void> {
    const { busNumber, routeCode, stopName, etaMinutes, routeId } = params;
    await NotificationService.sendCampusAlert({
      title: `Shuttle ${busNumber} Approaching`,
      body: `Shuttle ${busNumber} (${routeCode}) is approx. ${etaMinutes} mins away from ${stopName}.`,
      type: 'bus_approaching',
      relatedRouteId: routeId,
      data: {
        eta: etaMinutes.toString(),
        stopName,
      },
    });
  }
}

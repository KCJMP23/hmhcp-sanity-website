import { createClient } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

export type AttributionModel = 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'position-based';

interface Touchpoint {
  timestamp: Date;
  type: string;
  url: string;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
}

interface Attribution {
  source: string;
  medium: string;
  campaign?: string;
  credit: number;
  touchpoints: number;
}

export class AttributionEngine {
  private supabase = createClient();

  async calculateAttribution(
    conversionPath: Touchpoint[],
    model: AttributionModel = 'last-touch'
  ): Promise<Attribution[]> {
    if (conversionPath.length === 0) return [];

    switch (model) {
      case 'first-touch':
        return this.firstTouchAttribution(conversionPath);
      case 'last-touch':
        return this.lastTouchAttribution(conversionPath);
      case 'linear':
        return this.linearAttribution(conversionPath);
      case 'time-decay':
        return this.timeDecayAttribution(conversionPath);
      case 'position-based':
        return this.positionBasedAttribution(conversionPath);
      default:
        return this.lastTouchAttribution(conversionPath);
    }
  }

  private firstTouchAttribution(touchpoints: Touchpoint[]): Attribution[] {
    const first = touchpoints[0];
    return [{
      source: first.source || 'direct',
      medium: first.medium || 'none',
      campaign: first.campaign || undefined,
      credit: 1.0,
      touchpoints: 1,
    }];
  }

  private lastTouchAttribution(touchpoints: Touchpoint[]): Attribution[] {
    const last = touchpoints[touchpoints.length - 1];
    return [{
      source: last.source || 'direct',
      medium: last.medium || 'none',
      campaign: last.campaign || undefined,
      credit: 1.0,
      touchpoints: 1,
    }];
  }

  private linearAttribution(touchpoints: Touchpoint[]): Attribution[] {
    const creditPerTouch = 1.0 / touchpoints.length;
    const attributionMap = new Map<string, Attribution>();

    touchpoints.forEach(tp => {
      const key = `${tp.source || 'direct'}_${tp.medium || 'none'}_${tp.campaign || ''}`;
      const existing = attributionMap.get(key);
      
      if (existing) {
        existing.credit += creditPerTouch;
        existing.touchpoints += 1;
      } else {
        attributionMap.set(key, {
          source: tp.source || 'direct',
          medium: tp.medium || 'none',
          campaign: tp.campaign || undefined,
          credit: creditPerTouch,
          touchpoints: 1,
        });
      }
    });

    return Array.from(attributionMap.values());
  }

  private timeDecayAttribution(touchpoints: Touchpoint[]): Attribution[] {
    if (touchpoints.length === 0) return [];

    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const conversionTime = touchpoints[touchpoints.length - 1].timestamp.getTime();
    const attributionMap = new Map<string, Attribution>();

    // Calculate decay factors
    const decayFactors = touchpoints.map(tp => {
      const timeDiff = conversionTime - tp.timestamp.getTime();
      return Math.pow(2, -timeDiff / halfLife);
    });

    const totalDecay = decayFactors.reduce((sum, factor) => sum + factor, 0);

    // Assign credit
    touchpoints.forEach((tp, index) => {
      const credit = decayFactors[index] / totalDecay;
      const key = `${tp.source || 'direct'}_${tp.medium || 'none'}_${tp.campaign || ''}`;
      const existing = attributionMap.get(key);
      
      if (existing) {
        existing.credit += credit;
        existing.touchpoints += 1;
      } else {
        attributionMap.set(key, {
          source: tp.source || 'direct',
          medium: tp.medium || 'none',
          campaign: tp.campaign || undefined,
          credit,
          touchpoints: 1,
        });
      }
    });

    return Array.from(attributionMap.values());
  }

  private positionBasedAttribution(touchpoints: Touchpoint[]): Attribution[] {
    if (touchpoints.length === 0) return [];
    
    const attributionMap = new Map<string, Attribution>();

    // 40% to first touch, 40% to last touch, 20% distributed among middle touches
    touchpoints.forEach((tp, index) => {
      let credit = 0;
      
      if (index === 0) {
        credit = 0.4;
      } else if (index === touchpoints.length - 1) {
        credit = 0.4;
      } else {
        // Distribute 20% among middle touches
        const middleTouches = touchpoints.length - 2;
        credit = 0.2 / middleTouches;
      }

      const key = `${tp.source || 'direct'}_${tp.medium || 'none'}_${tp.campaign || ''}`;
      const existing = attributionMap.get(key);
      
      if (existing) {
        existing.credit += credit;
        existing.touchpoints += 1;
      } else {
        attributionMap.set(key, {
          source: tp.source || 'direct',
          medium: tp.medium || 'none',
          campaign: tp.campaign || undefined,
          credit,
          touchpoints: 1,
        });
      }
    });

    return Array.from(attributionMap.values());
  }

  async getConversionPath(sessionId: string, visitorId: string): Promise<Touchpoint[]> {
    // Get all page views for this visitor leading to conversion
    const { data: pageViews } = await this.supabase
      .from('page_views')
      .select('session_id, visitor_id, page_url, viewed_at')
      .eq('visitor_id', visitorId)
      .order('viewed_at', { ascending: true });

    if (!pageViews || pageViews.length === 0) return [];

    // Get session data for attribution info
    const { data: sessions } = await this.supabase
      .from('visitor_sessions')
      .select('session_id, visitor_id, utm_source, utm_medium, utm_campaign, referrer_domain, referrer_type, created_at')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: true });

    const sessionMap = new Map<string, any>();
    if (sessions && Array.isArray(sessions)) {
      sessions.forEach((s: any) => {
        if (s.session_id) {
          sessionMap.set(s.session_id, s);
        }
      });
    }

    return pageViews.map((pv: any) => {
      const session = sessionMap.get(pv.session_id);
      return {
        timestamp: new Date(pv.viewed_at),
        type: 'page_view',
        url: pv.page_url,
        source: session?.utm_source || session?.referrer_domain,
        medium: session?.utm_medium || session?.referrer_type,
        campaign: session?.utm_campaign,
      };
    });
  }

  async saveAttributionPath(
    conversionId: string,
    touchpoints: Touchpoint[],
    model: AttributionModel
  ) {
    const attributions = await this.calculateAttribution(touchpoints, model);
    const conversionTime = touchpoints[touchpoints.length - 1].timestamp;

    // Save each touchpoint with its attribution credit
    const pathData = touchpoints.map((tp, index) => {
      const attribution = attributions.find(a => 
        a.source === (tp.source || 'direct') && 
        a.medium === (tp.medium || 'none')
      );

      return {
        conversion_id: conversionId,
        touchpoint_index: index,
        touchpoint_type: tp.type,
        touchpoint_url: tp.url,
        touchpoint_source: tp.source || 'direct',
        touchpoint_medium: tp.medium || 'none',
        touchpoint_campaign: tp.campaign,
        touchpoint_timestamp: tp.timestamp.toISOString(),
        days_to_conversion: Math.floor((conversionTime.getTime() - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24)),
        attribution_credit: attribution?.credit || 0,
      };
    });

    const { error } = await this.supabase
      .from('attribution_paths')
      .insert(pathData);

    if (error) {
      const err = (error as unknown) instanceof Error ? error : new Error(String(error));
      logger.error('Error saving attribution path:', { error: err, action: 'error_logged', metadata: { error } });
    }
  }

  async getAttributionReport(
    goalId: string,
    model: AttributionModel = 'last-touch',
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    // Get conversions for the goal
    let query = this.supabase
      .from('conversions')
      .select('*')
      .eq('goal_id', goalId);

    if (startDate) {
      query = query.gte('converted_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('converted_at', endDate.toISOString());
    }

    const { data: conversions } = await query;
    if (!conversions || conversions.length === 0) return null;

    // Get attribution paths for these conversions
    const conversionIds = conversions.map((c: any) => c.id);
    const { data: paths } = await this.supabase
      .from('attribution_paths')
      .select('*')
      .in('conversion_id', conversionIds);

    if (!paths) return null;

    // Group by source/medium/campaign
    const attributionSummary = new Map<string, {
      source: string;
      medium: string;
      campaign?: string;
      conversions: number;
      value: number;
      credit: number;
    }>();

    for (const conversion of conversions as any[]) {
      const conversionPaths = paths.filter((p: any) => p.conversion_id === conversion.id);
      
      // Recalculate attribution for this model
      const touchpoints: Touchpoint[] = conversionPaths.map((p: any) => ({
        timestamp: new Date(p.touchpoint_timestamp),
        type: p.touchpoint_type,
        url: p.touchpoint_url,
        source: p.touchpoint_source,
        medium: p.touchpoint_medium,
        campaign: p.touchpoint_campaign,
      }));

      const attributions = await this.calculateAttribution(touchpoints, model);
      
      attributions.forEach(attr => {
        const key = `${attr.source}_${attr.medium}_${attr.campaign || ''}`;
        const existing = attributionSummary.get(key);
        
        if (existing) {
          existing.conversions += attr.credit;
          existing.value += (conversion.conversion_value || 0) * attr.credit;
          existing.credit += attr.credit;
        } else {
          attributionSummary.set(key, {
            source: attr.source,
            medium: attr.medium,
            campaign: attr.campaign,
            conversions: attr.credit,
            value: (conversion.conversion_value || 0) * attr.credit,
            credit: attr.credit,
          });
        }
      });
    }

    return {
      model,
      totalConversions: conversions.length,
      totalValue: conversions.reduce((sum: number, c: any) => sum + (c.conversion_value || 0), 0),
      channels: Array.from(attributionSummary.values())
        .sort((a, b) => b.conversions - a.conversions),
    };
  }

  async compareAttributionModels(
    goalId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const models: AttributionModel[] = ['first-touch', 'last-touch', 'linear', 'time-decay', 'position-based'];
    
    const reports = await Promise.all(
      models.map(model => this.getAttributionReport(goalId, model, startDate, endDate))
    );

    return {
      models: reports.filter(r => r !== null),
      comparison: this.generateModelComparison(reports),
    };
  }

  private generateModelComparison(reports: any[]): any {
    if (!reports || reports.length === 0) return null;

    // Find all unique channels across all models
    const allChannels = new Set<string>();
    reports.forEach(report => {
      if (report && report.channels) {
        report.channels.forEach((channel: any) => {
          allChannels.add(`${channel.source}_${channel.medium}_${channel.campaign || ''}`);
        });
      }
    });

    // Compare credit distribution across models
    const comparison = Array.from(allChannels).map(channelKey => {
      const [source, medium, campaign] = channelKey.split('_');
      const modelCredits: any = {};

      reports.forEach(report => {
        if (report && report.channels) {
          const channel = report.channels.find((c: any) => 
            `${c.source}_${c.medium}_${c.campaign || ''}` === channelKey
          );
          modelCredits[report.model] = channel ? channel.conversions : 0;
        }
      });

      return {
        source,
        medium,
        campaign: campaign || null,
        ...modelCredits,
      };
    });

    return comparison;
  }
}
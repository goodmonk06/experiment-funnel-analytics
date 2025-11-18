export interface AnalyticsConfig {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
}

export interface TrackEventOptions {
  userId?: string;
  anonymousId?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export class Analytics {
  private apiKey: string;
  private endpoint: string;
  private debug: boolean;
  private anonymousId: string;
  private userId?: string;
  private queue: any[] = [];
  private flushTimer?: number;

  constructor(config: AnalyticsConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'http://localhost:3001';
    this.debug = config.debug || false;
    this.anonymousId = this.getOrCreateAnonymousId();

    // Auto-flush queue every 5 seconds
    if (typeof window !== 'undefined') {
      this.flushTimer = window.setInterval(() => {
        this.flush();
      }, 5000);
    }

    this.log('Analytics initialized', { apiKey: this.apiKey });
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[Analytics]', ...args);
    }
  }

  private getOrCreateAnonymousId(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.generateId();
    }

    const key = 'analytics_anonymous_id';
    let id = window.localStorage.getItem(key);

    if (!id) {
      id = this.generateId();
      window.localStorage.setItem(key, id);
    }

    return id;
  }

  private generateId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  identify(userId: string) {
    this.userId = userId;
    this.log('User identified', { userId });
  }

  track(event: string, properties?: Record<string, any>) {
    const payload = {
      event,
      userId: this.userId,
      anonymousId: this.anonymousId,
      properties: properties || {},
      timestamp: new Date().toISOString(),
    };

    this.queue.push(payload);
    this.log('Event tracked', payload);

    // Auto-flush if queue is large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) {
      return;
    }

    const events = [...this.queue];
    this.queue = [];

    try {
      const response = await fetch(`${this.endpoint}/ingest/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }

      this.log('Events flushed', { count: events.length });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  async getExperimentVariant(experimentKey: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.endpoint}/experiments/${experimentKey}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          body: JSON.stringify({
            userId: this.userId,
            anonymousId: this.anonymousId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get variant: ${response.statusText}`);
      }

      const data = await response.json();
      this.log('Experiment variant assigned', { experimentKey, variant: data.variant });
      return data.variant;
    } catch (error) {
      console.error('Failed to get experiment variant:', error);
      return 'control'; // Default to control on error
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Global singleton instance
let instance: Analytics | null = null;

export function init(config: AnalyticsConfig): Analytics {
  instance = new Analytics(config);
  return instance;
}

export function track(event: string, properties?: Record<string, any>) {
  if (!instance) {
    console.warn('Analytics not initialized. Call init() first.');
    return;
  }
  instance.track(event, properties);
}

export function identify(userId: string) {
  if (!instance) {
    console.warn('Analytics not initialized. Call init() first.');
    return;
  }
  instance.identify(userId);
}

export function getExperimentVariant(experimentKey: string): Promise<string> {
  if (!instance) {
    console.warn('Analytics not initialized. Call init() first.');
    return Promise.resolve('control');
  }
  return instance.getExperimentVariant(experimentKey);
}

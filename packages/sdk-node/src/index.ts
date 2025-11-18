import fetch from 'node-fetch';

export interface AnalyticsConfig {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
  flushInterval?: number;
  maxQueueSize?: number;
}

export interface TrackEventOptions {
  userId?: string;
  anonymousId?: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export class Analytics {
  private apiKey: string;
  private endpoint: string;
  private debug: boolean;
  private queue: any[] = [];
  private flushTimer?: NodeJS.Timeout;
  private flushInterval: number;
  private maxQueueSize: number;

  constructor(config: AnalyticsConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'http://localhost:3001';
    this.debug = config.debug || false;
    this.flushInterval = config.flushInterval || 5000;
    this.maxQueueSize = config.maxQueueSize || 100;

    // Auto-flush queue
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    this.log('Analytics initialized', { apiKey: this.apiKey });
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[Analytics]', ...args);
    }
  }

  track(options: TrackEventOptions) {
    if (!options.event) {
      throw new Error('Event name is required');
    }

    if (!options.userId && !options.anonymousId) {
      throw new Error('Either userId or anonymousId is required');
    }

    const payload = {
      event: options.event,
      userId: options.userId,
      anonymousId: options.anonymousId,
      properties: options.properties || {},
      timestamp: options.timestamp?.toISOString() || new Date().toISOString(),
    };

    this.queue.push(payload);
    this.log('Event tracked', payload);

    // Auto-flush if queue is large
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
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
        const error = await response.text();
        throw new Error(`Failed to send events: ${response.statusText} - ${error}`);
      }

      this.log('Events flushed', { count: events.length });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  async getExperimentVariant(
    experimentKey: string,
    userId?: string,
    anonymousId?: string
  ): Promise<string> {
    if (!userId && !anonymousId) {
      throw new Error('Either userId or anonymousId is required');
    }

    try {
      const response = await fetch(
        `${this.endpoint}/experiments/${experimentKey}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          body: JSON.stringify({ userId, anonymousId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get variant: ${response.statusText}`);
      }

      const data: any = await response.json();
      this.log('Experiment variant assigned', {
        experimentKey,
        variant: data.variant,
      });
      return data.variant;
    } catch (error) {
      console.error('Failed to get experiment variant:', error);
      return 'control'; // Default to control on error
    }
  }

  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

export function createClient(config: AnalyticsConfig): Analytics {
  return new Analytics(config);
}

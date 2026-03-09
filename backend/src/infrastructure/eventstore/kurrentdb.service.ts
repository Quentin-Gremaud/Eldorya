import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  KurrentDBClient,
  jsonEvent,
  FORWARDS,
  NO_STREAM,
  START,
} from '@kurrent/kurrentdb-client';

@Injectable()
export class KurrentDbService implements OnModuleInit {
  private readonly logger = new Logger(KurrentDbService.name);
  private client: KurrentDBClient;

  onModuleInit() {
    const connectionString =
      process.env.KURRENTDB_CONNECTION_STRING ||
      'kurrentdb://localhost:2113?tls=false';
    this.client = KurrentDBClient.connectionString(connectionString);
    this.logger.log(`KurrentDB client initialized with: ${connectionString}`);
  }

  getClient(): KurrentDBClient {
    return this.client;
  }

  async appendToStream(
    streamName: string,
    eventType: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ) {
    const event = jsonEvent({
      type: eventType,
      data,
      metadata,
    });
    return this.client.appendToStream(streamName, [event]);
  }

  async appendToNewStream(
    streamName: string,
    eventType: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ) {
    const event = jsonEvent({
      type: eventType,
      data,
      metadata,
    });
    return this.client.appendToStream(streamName, [event], {
      streamState: NO_STREAM,
    });
  }

  async appendEventsToStream(
    streamName: string,
    events: Array<{
      eventType: string;
      data: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>,
  ) {
    const jsonEvents = events.map((e) =>
      jsonEvent({
        type: e.eventType,
        data: e.data,
        metadata: e.metadata,
      }),
    );
    return this.client.appendToStream(streamName, jsonEvents);
  }

  async appendEventsToNewStream(
    streamName: string,
    events: Array<{
      eventType: string;
      data: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>,
  ) {
    const jsonEvents = events.map((e) =>
      jsonEvent({
        type: e.eventType,
        data: e.data,
        metadata: e.metadata,
      }),
    );
    return this.client.appendToStream(streamName, jsonEvents, {
      streamState: NO_STREAM,
    });
  }

  async readStream(streamName: string) {
    const events = this.client.readStream(streamName, {
      direction: FORWARDS,
      fromRevision: START,
    });

    const result: Array<{
      type: string;
      data: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }> = [];

    for await (const resolvedEvent of events) {
      if (resolvedEvent.event) {
        result.push({
          type: resolvedEvent.event.type,
          data: resolvedEvent.event.data as Record<string, unknown>,
          metadata:
            (resolvedEvent.event.metadata as Record<string, unknown>) || {},
        });
      }
    }

    return result;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testStreamName = `health-check-${Date.now()}`;
      await this.appendToStream(testStreamName, 'HealthCheckEvent', {
        timestamp: new Date().toISOString(),
      });
      const events = await this.readStream(testStreamName);
      return events.length > 0;
    } catch (error) {
      this.logger.error('KurrentDB health check failed', error);
      return false;
    }
  }
}

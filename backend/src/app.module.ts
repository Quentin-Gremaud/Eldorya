import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';

// Infrastructure
import { AuthModule } from './infrastructure/auth/auth.module.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { EventStoreModule } from './infrastructure/eventstore/eventstore.module.js';
import { UserModule } from './infrastructure/user/user.module.js';
import { AssetStorageModule } from './infrastructure/asset-storage/asset-storage.module.js';

// Gateway
import { GatewayModule } from './gateway/gateway.module.js';

// Presentation
import { UserPresentationModule } from './presentation/user/user-presentation.module.js';
import { CampaignPresentationModule } from './presentation/campaign/campaign-presentation.module.js';
import { NotificationPresentationModule } from './presentation/notification/notification-presentation.module.js';
import { CharacterPresentationModule } from './presentation/character/character-presentation.module.js';
import { InventoryPresentationModule } from './presentation/inventory/inventory-presentation.module.js';
import { MapPresentationModule } from './presentation/map/map-presentation.module.js';
import { TokenPresentationModule } from './presentation/token/token-presentation.module.js';
import { FogPresentationModule } from './presentation/fog/fog-presentation.module.js';
import { SessionPresentationModule } from './presentation/session/session-presentation.module.js';

// Bounded Contexts
import { CampaignModule } from './campaign/campaign.module.js';
import { WorldModule } from './world/world.module.js';
import { SessionModule } from './session/session.module.js';
import { CharacterModule } from './character/character.module.js';
import { ChatModule } from './chat/chat.module.js';
import { SubscriptionModule } from './subscription/subscription.module.js';

@Module({
  imports: [
    // NestJS CQRS
    CqrsModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),

    // Infrastructure
    AuthModule,
    DatabaseModule,
    EventStoreModule,
    UserModule,
    AssetStorageModule,

    // WebSocket Gateway
    GatewayModule,

    // Presentation
    UserPresentationModule,
    CampaignPresentationModule,
    NotificationPresentationModule,
    CharacterPresentationModule,
    InventoryPresentationModule,
    MapPresentationModule,
    TokenPresentationModule,
    FogPresentationModule,
    SessionPresentationModule,

    // Bounded Contexts
    CampaignModule,
    WorldModule,
    SessionModule,
    CharacterModule,
    ChatModule,
    SubscriptionModule,
  ],
})
export class AppModule {}

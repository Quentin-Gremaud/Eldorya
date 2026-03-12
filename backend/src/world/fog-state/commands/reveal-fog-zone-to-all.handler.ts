import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RevealFogZoneToAllCommand } from './reveal-fog-zone-to-all.command.js';
import { FogZone } from '../fog-zone.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import { FogZoneAlreadyRevealedException } from '../exceptions/fog-zone-already-revealed.exception.js';
import type { CampaignPlayerProvider } from '../campaign-player.provider.js';
import { CAMPAIGN_PLAYER_PROVIDER } from '../campaign-player.provider.js';

@CommandHandler(RevealFogZoneToAllCommand)
export class RevealFogZoneToAllHandler
  implements ICommandHandler<RevealFogZoneToAllCommand>
{
  private readonly logger = new Logger(RevealFogZoneToAllHandler.name);

  constructor(
    @Inject(FOG_STATE_REPOSITORY)
    private readonly fogStateRepository: FogStateRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(CAMPAIGN_PLAYER_PROVIDER)
    private readonly campaignPlayerProvider: CampaignPlayerProvider,
  ) {}

  async execute(command: RevealFogZoneToAllCommand): Promise<void> {
    const playerIds = await this.campaignPlayerProvider.getPlayerIdsForCampaign(
      command.campaignId,
    );

    const fogZone = FogZone.create(
      command.fogZoneId,
      command.mapLevelId,
      command.x,
      command.y,
      command.width,
      command.height,
    );

    let revealedCount = 0;

    for (const playerId of playerIds) {
      const aggregate = await this.fogStateRepository.load(
        command.campaignId,
        playerId,
      );

      try {
        aggregate.revealZone(fogZone, this.clock);
        await this.fogStateRepository.save(aggregate);
        revealedCount++;
      } catch (error) {
        if (error instanceof FogZoneAlreadyRevealedException) {
          this.logger.log(
            `FogZone ${command.fogZoneId} already revealed for player ${playerId} — skipping`,
          );
          continue;
        }
        throw error;
      }
    }

    this.logger.log(
      `FogZone ${command.fogZoneId} revealed for ${revealedCount}/${playerIds.length} players in campaign ${command.campaignId}`,
    );
  }
}

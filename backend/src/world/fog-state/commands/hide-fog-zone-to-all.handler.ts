import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { HideFogZoneToAllCommand } from './hide-fog-zone-to-all.command.js';
import type { FogStateRepository } from '../fog-state.repository.js';
import { FOG_STATE_REPOSITORY } from '../fog-state.repository.js';
import type { Clock } from '../../../shared/clock.js';
import { CLOCK } from '../../../shared/clock.js';
import { FogZoneNotFoundException } from '../exceptions/fog-zone-not-found.exception.js';
import type { CampaignPlayerProvider } from '../campaign-player.provider.js';
import { CAMPAIGN_PLAYER_PROVIDER } from '../campaign-player.provider.js';

@CommandHandler(HideFogZoneToAllCommand)
export class HideFogZoneToAllHandler
  implements ICommandHandler<HideFogZoneToAllCommand>
{
  private readonly logger = new Logger(HideFogZoneToAllHandler.name);

  constructor(
    @Inject(FOG_STATE_REPOSITORY)
    private readonly fogStateRepository: FogStateRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(CAMPAIGN_PLAYER_PROVIDER)
    private readonly campaignPlayerProvider: CampaignPlayerProvider,
  ) {}

  async execute(command: HideFogZoneToAllCommand): Promise<void> {
    const playerIds = await this.campaignPlayerProvider.getPlayerIdsForCampaign(
      command.campaignId,
    );

    let hiddenCount = 0;

    for (const playerId of playerIds) {
      const aggregate = await this.fogStateRepository.load(
        command.campaignId,
        playerId,
      );

      try {
        aggregate.hideZone(command.fogZoneId, this.clock);
        await this.fogStateRepository.save(aggregate);
        hiddenCount++;
      } catch (error) {
        if (error instanceof FogZoneNotFoundException) {
          this.logger.log(
            `FogZone ${command.fogZoneId} not revealed for player ${playerId} — skipping`,
          );
          continue;
        }
        throw error;
      }
    }

    this.logger.log(
      `FogZone ${command.fogZoneId} hidden for ${hiddenCount}/${playerIds.length} players in campaign ${command.campaignId}`,
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { PipelineModeChecker } from '../../session/action-pipeline/pipeline-mode-checker.port.js';

@Injectable()
export class PrismaPipelineModeChecker implements PipelineModeChecker {
  private readonly logger = new Logger(PrismaPipelineModeChecker.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPipelineMode(
    sessionId: string,
    campaignId: string,
  ): Promise<'optional' | 'mandatory'> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { pipelineMode: true, campaignId: true },
    });
    if (!session || session.campaignId !== campaignId) {
      this.logger.warn(
        `Session ${sessionId} not found or campaign mismatch (expected: ${campaignId}) — defaulting to mandatory for safety`,
      );
      return 'mandatory';
    }
    const mode = session.pipelineMode;
    if (mode !== 'optional' && mode !== 'mandatory') {
      this.logger.error(
        `Corrupted pipeline mode value "${mode}" for session ${sessionId} — defaulting to mandatory for safety`,
      );
      return 'mandatory';
    }
    return mode;
  }
}

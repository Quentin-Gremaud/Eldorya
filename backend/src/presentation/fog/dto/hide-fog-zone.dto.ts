import { IsUUID } from 'class-validator';

export class HideFogZoneDto {
  @IsUUID()
  fogZoneId!: string;

  @IsUUID()
  playerId!: string;

  @IsUUID()
  commandId!: string;
}

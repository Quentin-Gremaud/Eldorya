import { IsUUID } from 'class-validator';

export class HideFogZoneToAllDto {
  @IsUUID()
  fogZoneId!: string;

  @IsUUID()
  commandId!: string;
}

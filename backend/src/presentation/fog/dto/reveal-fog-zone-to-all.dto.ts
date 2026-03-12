import { IsUUID, IsNumber, Min } from 'class-validator';

export class RevealFogZoneToAllDto {
  @IsUUID()
  fogZoneId!: string;

  @IsUUID()
  mapLevelId!: string;

  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  @Min(1)
  width!: number;

  @IsNumber()
  @Min(1)
  height!: number;

  @IsUUID()
  commandId!: string;
}

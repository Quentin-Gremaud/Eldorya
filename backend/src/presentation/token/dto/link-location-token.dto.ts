import { IsUUID } from 'class-validator';

export class LinkLocationTokenDto {
  @IsUUID()
  destinationMapLevelId!: string;
}

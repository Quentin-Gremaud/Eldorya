import {
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
  IsOptional,
  Length,
} from 'class-validator';

export class PlaceTokenDto {
  @IsUUID()
  tokenId!: string;

  @IsUUID()
  mapLevelId!: string;

  @IsInt()
  @Min(0)
  @Max(100000)
  x!: number;

  @IsInt()
  @Min(0)
  @Max(100000)
  y!: number;

  @IsIn(['player', 'npc', 'monster', 'location'])
  tokenType!: string;

  @IsString()
  @Length(1, 100)
  label!: string;

  @IsUUID()
  @IsOptional()
  destinationMapLevelId?: string;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

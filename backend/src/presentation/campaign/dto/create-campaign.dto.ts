import { IsUUID, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateCampaignDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

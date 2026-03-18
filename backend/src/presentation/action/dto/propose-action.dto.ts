import { IsUUID, IsIn, IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class ProposeActionDto {
  @IsUUID()
  actionId!: string;

  @IsIn(['move', 'attack', 'interact', 'free-text'])
  actionType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  target?: string;
}

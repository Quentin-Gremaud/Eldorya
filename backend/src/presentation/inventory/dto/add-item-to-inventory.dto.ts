import { IsUUID, IsString, IsNumber, IsIn, IsOptional, Max, Min, MaxLength } from 'class-validator';

export class AddItemToInventoryDto {
  @IsUUID()
  @IsOptional()
  commandId?: string;

  @IsUUID()
  itemId!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(999)
  weight!: number;

  @IsIn(['head', 'torso', 'hands', 'legs', 'feet', 'ring1', 'ring2', 'weapon_shield'])
  slotType!: string;

  @IsOptional()
  statModifiers?: Record<string, number>;
}

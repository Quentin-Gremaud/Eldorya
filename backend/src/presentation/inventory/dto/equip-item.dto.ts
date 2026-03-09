import { IsUUID, IsIn } from 'class-validator';

export class EquipItemDto {
  @IsUUID()
  itemId!: string;

  @IsIn(['head', 'torso', 'hands', 'legs', 'feet', 'ring1', 'ring2', 'weapon_shield'])
  slotType!: string;
}

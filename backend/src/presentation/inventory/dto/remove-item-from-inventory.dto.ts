import { IsUUID, IsOptional } from 'class-validator';

export class RemoveItemFromInventoryDto {
  @IsUUID()
  @IsOptional()
  commandId?: string;

  @IsUUID()
  itemId!: string;
}

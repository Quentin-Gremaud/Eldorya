import { IsUUID } from 'class-validator';

export class UnequipItemDto {
  @IsUUID()
  itemId!: string;
}

import { IsUUID } from 'class-validator';

export class DropItemDto {
  @IsUUID()
  itemId!: string;
}

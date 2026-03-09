import { IsUUID, IsInt, Min, Max } from 'class-validator';

export class MoveItemDto {
  @IsUUID()
  itemId!: string;

  @IsInt()
  @Min(0)
  @Max(999)
  toPosition!: number;
}

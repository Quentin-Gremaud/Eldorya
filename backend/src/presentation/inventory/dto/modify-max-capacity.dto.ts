import { IsNumber, Min, Max, IsOptional, IsUUID } from 'class-validator';

export class ModifyMaxCapacityDto {
  @IsNumber()
  @Min(0)
  @Max(9999)
  newMaxCapacity!: number;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

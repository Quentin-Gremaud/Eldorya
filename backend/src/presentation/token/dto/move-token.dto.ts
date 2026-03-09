import { IsInt, Min, Max, IsUUID, IsOptional } from 'class-validator';

export class MoveTokenDto {
  @IsInt()
  @Min(0)
  @Max(100000)
  x!: number;

  @IsInt()
  @Min(0)
  @Max(100000)
  y!: number;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

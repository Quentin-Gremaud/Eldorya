import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ValidateActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  narrativeNote?: string;
}

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class RenameMapLevelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

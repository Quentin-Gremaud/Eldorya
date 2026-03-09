import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreateMapLevelDto {
  @IsUUID()
  mapLevelId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

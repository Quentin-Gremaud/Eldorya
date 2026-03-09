import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StatsDto {
  @IsInt()
  @Min(1)
  @Max(20)
  strength!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  dexterity!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  constitution!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  intelligence!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  wisdom!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  charisma!: number;
}

export class CreateACharacterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsNotEmpty()
  race!: string;

  @IsString()
  @IsNotEmpty()
  characterClass!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  background!: string;

  @ValidateNested()
  @Type(() => StatsDto)
  stats!: StatsDto;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  spells!: string[];
}

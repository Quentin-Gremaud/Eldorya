import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Orc', 'Gnome', 'Half-Elf', 'Tiefling', 'Dragonborn',
];

const ALLOWED_CLASSES = [
  'Warrior', 'Mage', 'Rogue', 'Cleric', 'Ranger', 'Paladin', 'Bard', 'Warlock', 'Druid', 'Monk',
];

export class StatsModificationDto {
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

export class ModifyCharacterByGmDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_RACES, { message: `race must be one of: ${ALLOWED_RACES.join(', ')}` })
  race?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_CLASSES, { message: `characterClass must be one of: ${ALLOWED_CLASSES.join(', ')}` })
  characterClass?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  background?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StatsModificationDto)
  stats?: StatsModificationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Spell names must not be empty' })
  @ArrayMaxSize(20)
  spells?: string[];

  @ValidateIf((o) => {
    return (
      o.name === undefined &&
      o.race === undefined &&
      o.characterClass === undefined &&
      o.background === undefined &&
      o.stats === undefined &&
      o.spells === undefined
    );
  })
  @IsNotEmpty({ message: 'At least one modification field must be provided' })
  private get _atLeastOneField(): string | undefined {
    if (
      this.name !== undefined ||
      this.race !== undefined ||
      this.characterClass !== undefined ||
      this.background !== undefined ||
      this.stats !== undefined ||
      this.spells !== undefined
    ) {
      return 'valid';
    }
    return undefined;
  }
}

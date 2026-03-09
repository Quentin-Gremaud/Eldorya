import {
  IsString,
  IsOptional,
  IsObject,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

const ALLOWED_FIELDS = [
  'name',
  'race',
  'characterClass',
  'background',
  'stats',
  'spells',
];

export class RequestCharacterModificationDto {
  @IsUUID()
  commandId!: string;

  @IsObject()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value !== 'object' || value === null) return value;
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (!ALLOWED_FIELDS.includes(key)) continue;
      if (
        typeof val !== 'object' ||
        val === null ||
        !('current' in val) ||
        !('proposed' in val)
      ) {
        continue;
      }
      filtered[key] = val;
    }
    return Object.keys(filtered).length > 0 ? filtered : value;
  })
  proposedChanges!: Record<string, { current: unknown; proposed: unknown }>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

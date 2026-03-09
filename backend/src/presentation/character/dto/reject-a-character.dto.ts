import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectACharacterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

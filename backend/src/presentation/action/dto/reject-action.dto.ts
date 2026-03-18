import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  feedback!: string;
}

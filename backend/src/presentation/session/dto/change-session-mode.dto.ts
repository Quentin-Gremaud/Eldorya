import { IsIn } from 'class-validator';

export class ChangeSessionModeDto {
  @IsIn(['preparation', 'live'])
  mode!: string;
}

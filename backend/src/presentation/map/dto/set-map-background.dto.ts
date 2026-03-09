import { IsUrl, IsUUID, IsOptional } from 'class-validator';

export class SetMapBackgroundDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  backgroundImageUrl!: string;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

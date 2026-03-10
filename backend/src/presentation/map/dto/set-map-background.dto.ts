import { IsUrl, IsUUID, IsOptional } from 'class-validator';

export class SetMapBackgroundDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  backgroundImageUrl!: string;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

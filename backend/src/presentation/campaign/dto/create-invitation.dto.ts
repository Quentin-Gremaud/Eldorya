import { IsOptional, IsInt, Min, Max } from 'class-validator';

// H5: Removed redundant campaignId — route param is canonical (with ParseUUIDPipe)
export class CreateInvitationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays: number = 7;
}

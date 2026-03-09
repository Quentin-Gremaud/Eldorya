import { IsIn, IsInt, Min, Max, IsUUID, IsOptional } from 'class-validator';

export class RequestMapBackgroundUploadDto {
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(5242880)
  fileSizeBytes!: number;

  @IsUUID()
  @IsOptional()
  commandId?: string;
}

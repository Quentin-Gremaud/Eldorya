import { IsUUID } from 'class-validator';

export class PingPlayerDto {
  @IsUUID()
  playerId!: string;
}

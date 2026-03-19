import { IsIn } from 'class-validator';

export class TogglePipelineModeDto {
  @IsIn(['optional', 'mandatory'])
  pipelineMode!: 'optional' | 'mandatory';
}

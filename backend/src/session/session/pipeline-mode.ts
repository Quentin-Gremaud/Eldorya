import { SamePipelineModeException } from './exceptions/same-pipeline-mode.exception.js';

const ALLOWED_MODES = ['optional', 'mandatory'] as const;
export type PipelineModeValue = (typeof ALLOWED_MODES)[number];

export class PipelineMode {
  private constructor(private readonly value: PipelineModeValue) {}

  static fromString(mode: string): PipelineMode {
    if (!mode || !mode.trim()) {
      throw new Error('PipelineMode cannot be empty');
    }
    const trimmed = mode.trim().toLowerCase();
    if (!(ALLOWED_MODES as readonly string[]).includes(trimmed)) {
      throw new Error(
        `Invalid PipelineMode: '${mode}'. Must be one of: ${ALLOWED_MODES.join(', ')}.`,
      );
    }
    return new PipelineMode(trimmed as PipelineModeValue);
  }

  static fromPrimitives(mode: string): PipelineMode {
    if (!mode || typeof mode !== 'string') {
      throw new Error(`Corrupted event stream: pipeline mode is ${typeof mode}, expected string`);
    }
    const trimmed = mode.trim().toLowerCase();
    if (!(ALLOWED_MODES as readonly string[]).includes(trimmed)) {
      throw new Error(`Corrupted event stream: invalid pipeline mode "${mode}"`);
    }
    return new PipelineMode(trimmed as PipelineModeValue);
  }

  static optional(): PipelineMode {
    return new PipelineMode('optional');
  }

  static mandatory(): PipelineMode {
    return new PipelineMode('mandatory');
  }

  ensureDifferentFrom(other: PipelineMode): void {
    if (this.value === other.value) {
      throw SamePipelineModeException.forMode(this.value);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: PipelineMode | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}

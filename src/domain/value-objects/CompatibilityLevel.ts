export type CompatibilityLevelType = 'low' | 'medium' | 'high' | 'perfect';

export class CompatibilityLevel {
  private constructor(private readonly value: CompatibilityLevelType) {}

  public static create(score: number): CompatibilityLevel {
    if (score < 0.3) return new CompatibilityLevel('low');
    if (score < 0.6) return new CompatibilityLevel('medium');
    if (score < 0.9) return new CompatibilityLevel('high');
    return new CompatibilityLevel('perfect');
  }

  public static fromString(value: string): CompatibilityLevel {
    if (!['low', 'medium', 'high', 'perfect'].includes(value)) {
      throw new Error(`Invalid compatibility level: ${value}`);
    }
    return new CompatibilityLevel(value as CompatibilityLevelType);
  }

  public getValue(): CompatibilityLevelType {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}
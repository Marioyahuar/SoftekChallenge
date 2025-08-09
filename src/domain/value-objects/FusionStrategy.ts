export type FusionStrategyType = 'intelligent' | 'random' | 'theme';

export class FusionStrategy {
  private constructor(private readonly value: FusionStrategyType) {}

  public static create(value: string): FusionStrategy {
    if (!['intelligent', 'random', 'theme'].includes(value)) {
      throw new Error(`Invalid fusion strategy: ${value}`);
    }
    return new FusionStrategy(value as FusionStrategyType);
  }

  public getValue(): FusionStrategyType {
    return this.value;
  }

  public isIntelligent(): boolean {
    return this.value === 'intelligent';
  }

  public isRandom(): boolean {
    return this.value === 'random';
  }

  public isTheme(): boolean {
    return this.value === 'theme';
  }

  public toString(): string {
    return this.value;
  }
}
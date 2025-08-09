export class FusionScore {
  private constructor(private readonly value: number) {
    if (value < 0 || value > 1) {
      throw new Error('Fusion score must be between 0 and 1');
    }
  }

  public static create(value: number): FusionScore {
    return new FusionScore(value);
  }

  public getValue(): number {
    return this.value;
  }

  public isLow(): boolean {
    return this.value < 0.3;
  }

  public isMedium(): boolean {
    return this.value >= 0.3 && this.value < 0.6;
  }

  public isHigh(): boolean {
    return this.value >= 0.6 && this.value < 0.9;
  }

  public isPerfect(): boolean {
    return this.value >= 0.9;
  }

  public toString(): string {
    return this.value.toFixed(3);
  }
}
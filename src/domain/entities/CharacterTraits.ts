export class CharacterTraits {
  constructor(
    public readonly characterId: number,
    public readonly environmentTraits: string[],
    public readonly physicalTraits: string[],
    public readonly personalityTraits: string[],
    public readonly archetypeTraits: string[]
  ) {}

  public static create(data: {
    characterId: number;
    environmentTraits: string[];
    physicalTraits: string[];
    personalityTraits: string[];
    archetypeTraits: string[];
  }): CharacterTraits {
    return new CharacterTraits(
      data.characterId,
      data.environmentTraits,
      data.physicalTraits,
      data.personalityTraits,
      data.archetypeTraits
    );
  }

  public getAllTraits(): string[] {
    return [
      ...this.environmentTraits,
      ...this.physicalTraits,
      ...this.personalityTraits,
      ...this.archetypeTraits
    ];
  }

  public hasEnvironmentTrait(trait: string): boolean {
    return this.environmentTraits.includes(trait);
  }

  public hasPhysicalTrait(trait: string): boolean {
    return this.physicalTraits.includes(trait);
  }

  public hasPersonalityTrait(trait: string): boolean {
    return this.personalityTraits.includes(trait);
  }

  public hasArchetypeTrait(trait: string): boolean {
    return this.archetypeTraits.includes(trait);
  }

  public hasTrait(trait: string): boolean {
    return this.getAllTraits().includes(trait);
  }

  public getTraitsByCategory(category: 'environment' | 'physical' | 'personality' | 'archetype'): string[] {
    switch (category) {
      case 'environment': return this.environmentTraits;
      case 'physical': return this.physicalTraits;
      case 'personality': return this.personalityTraits;
      case 'archetype': return this.archetypeTraits;
      default: return [];
    }
  }
}
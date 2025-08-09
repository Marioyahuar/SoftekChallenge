export interface PokemonType {
  name: string;
}

export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface PokemonSprites {
  front_default: string;
}

export class Pokemon {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly types: PokemonType[],
    public readonly stats: PokemonStat[],
    public readonly sprites: PokemonSprites,
    public readonly height: number,
    public readonly weight: number
  ) {}

  public static create(data: {
    id: number;
    name: string;
    types: PokemonType[];
    stats: PokemonStat[];
    sprites: PokemonSprites;
    height: number;
    weight: number;
  }): Pokemon {
    return new Pokemon(
      data.id,
      data.name,
      data.types,
      data.stats,
      data.sprites,
      data.height,
      data.weight
    );
  }

  public hasType(typeName: string): boolean {
    return this.types.some(type => type.name.toLowerCase() === typeName.toLowerCase());
  }

  public isGroundType(): boolean {
    return this.hasType('ground');
  }

  public isRockType(): boolean {
    return this.hasType('rock');
  }

  public isWaterType(): boolean {
    return this.hasType('water');
  }

  public isIceType(): boolean {
    return this.hasType('ice');
  }

  public isGrassType(): boolean {
    return this.hasType('grass');
  }

  public isSteelType(): boolean {
    return this.hasType('steel');
  }

  public isElectricType(): boolean {
    return this.hasType('electric');
  }

  public isPsychicType(): boolean {
    return this.hasType('psychic');
  }

  public isDarkType(): boolean {
    return this.hasType('dark');
  }

  public getMainType(): string {
    return this.types[0]?.name || 'normal';
  }

  public getTypeNames(): string[] {
    return this.types.map(type => type.name);
  }

  public getStat(statName: string): number {
    const stat = this.stats.find(s => s.stat.name === statName);
    return stat?.base_stat || 0;
  }
}
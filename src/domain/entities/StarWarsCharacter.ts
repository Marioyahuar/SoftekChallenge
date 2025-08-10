export interface StarWarsHomeworld {
  name: string;
  climate: string;
  terrain: string;
}

export class StarWarsCharacter {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly height: number,
    public readonly mass: string,
    public readonly birthYear: string,
    public readonly species: string,
    public readonly gender: string,
    public readonly homeworld: StarWarsHomeworld
  ) {}

  public static create(data: {
    id: number;
    name: string;
    height: string;
    mass: string;
    birth_year: string;
    species: string;
    gender: string;
    homeworld: StarWarsHomeworld;
  }): StarWarsCharacter {
    return new StarWarsCharacter(
      data.id,
      data.name,
      parseInt(data.height) || 0,
      data.mass,
      data.birth_year, // This maps to birthYear property
      data.species,
      data.gender,
      data.homeworld
    );
  }

  public isSmall(): boolean {
    return this.height < 150;
  }

  public isTall(): boolean {
    return this.height > 200;
  }

  public isDroid(): boolean {
    return this.species.toLowerCase().includes('droid');
  }

  public isHuman(): boolean {
    return this.species.toLowerCase() === 'human';
  }

  public hasDesertEnvironment(): boolean {
    return this.homeworld.climate.toLowerCase().includes('arid') ||
           this.homeworld.terrain.toLowerCase().includes('desert');
  }

  public hasOceanEnvironment(): boolean {
    return this.homeworld.climate.toLowerCase().includes('ocean') ||
           this.homeworld.terrain.toLowerCase().includes('ocean');
  }

  public hasIceEnvironment(): boolean {
    return this.homeworld.climate.toLowerCase().includes('frozen') ||
           this.homeworld.climate.toLowerCase().includes('ice');
  }

  public hasForestEnvironment(): boolean {
    return this.homeworld.terrain.toLowerCase().includes('forest') ||
           this.homeworld.terrain.toLowerCase().includes('jungle');
  }
}
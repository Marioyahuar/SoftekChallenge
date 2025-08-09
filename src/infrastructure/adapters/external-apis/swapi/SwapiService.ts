import { HttpClient } from '../HttpClient';
import { apisConfig } from '../../../config/apis';
import { StarWarsCharacter } from '../../../../domain/entities/StarWarsCharacter';
import { SwapiError } from '../../../../domain/errors/ExternalApiError';
import { SwapiPerson, SwapiPlanet, SwapiSpecies } from './types';

export class SwapiService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(apisConfig.swapi, 'SWAPI');
  }

  public async getCharacter(id: number): Promise<StarWarsCharacter> {
    try {
      if (id < 1 || id > 82) {
        throw new SwapiError(`Character ID must be between 1 and 82, got: ${id}`);
      }

      const person = await this.httpClient.get<SwapiPerson>(`${apisConfig.swapi.endpoints.people}/${id}/`);
      
      const homeworldId = this.extractIdFromUrl(person.homeworld);
      const homeworld = await this.getPlanet(homeworldId);
      
      let speciesName = 'Unknown';
      if (person.species.length > 0) {
        const speciesId = this.extractIdFromUrl(person.species[0]);
        const species = await this.getSpecies(speciesId);
        speciesName = species.name;
      } else {
        speciesName = 'Human';
      }

      return StarWarsCharacter.create({
        id,
        name: person.name,
        height: person.height,
        mass: person.mass,
        birth_year: person.birth_year,
        species: speciesName,
        gender: person.gender,
        homeworld: {
          name: homeworld.name,
          climate: homeworld.climate,
          terrain: homeworld.terrain,
        },
      });
    } catch (error) {
      if (error instanceof SwapiError) {
        throw error;
      }
      throw new SwapiError(`Failed to fetch character ${id}: ${error}`);
    }
  }

  private async getPlanet(id: number): Promise<SwapiPlanet> {
    try {
      return await this.httpClient.get<SwapiPlanet>(`${apisConfig.swapi.endpoints.planets}/${id}/`);
    } catch (error) {
      throw new SwapiError(`Failed to fetch planet ${id}: ${error}`);
    }
  }

  private async getSpecies(id: number): Promise<SwapiSpecies> {
    try {
      return await this.httpClient.get<SwapiSpecies>(`${apisConfig.swapi.endpoints.species}/${id}/`);
    } catch (error) {
      throw new SwapiError(`Failed to fetch species ${id}: ${error}`);
    }
  }

  private extractIdFromUrl(url: string): number {
    const matches = url.match(/\/(\d+)\/$/);
    if (!matches || !matches[1]) {
      throw new SwapiError(`Invalid URL format: ${url}`);
    }
    return parseInt(matches[1], 10);
  }

  public async getRandomCharacterId(): Promise<number> {
    return Math.floor(Math.random() * 82) + 1;
  }

  public async getAllCharacters(): Promise<StarWarsCharacter[]> {
    const characters: StarWarsCharacter[] = [];
    
    for (let i = 1; i <= 82; i++) {
      try {
        const character = await this.getCharacter(i);
        characters.push(character);
      } catch (error) {
        console.warn(`Failed to fetch character ${i}:`, error);
      }
    }
    
    return characters;
  }
}
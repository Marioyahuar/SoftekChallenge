import { HttpClient } from '../HttpClient';
import { apisConfig } from '../../../config/apis';
import { Pokemon } from '../../../../domain/entities/Pokemon';
import { PokeApiError } from '../../../../domain/errors/ExternalApiError';
import { PokeApiPokemon } from './types';

export class PokeApiService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(apisConfig.pokeapi, 'PokeAPI');
  }

  public async getPokemon(id: number): Promise<Pokemon> {
    try {
      if (id < 1 || id > 1025) {
        throw new PokeApiError(`Pokemon ID must be between 1 and 1025, got: ${id}`);
      }

      const pokemonData = await this.httpClient.get<PokeApiPokemon>(
        `${apisConfig.pokeapi.endpoints.pokemon}/${id}/`
      );

      return Pokemon.create({
        id: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types.map(t => ({ name: t.type.name })),
        stats: pokemonData.stats.map(s => ({
          base_stat: s.base_stat,
          stat: { name: s.stat.name }
        })),
        sprites: {
          front_default: pokemonData.sprites.front_default || ''
        },
        height: pokemonData.height,
        weight: pokemonData.weight
      });
    } catch (error) {
      if (error instanceof PokeApiError) {
        throw error;
      }
      throw new PokeApiError(`Failed to fetch Pokemon ${id}: ${error}`);
    }
  }

  public async getPokemonByName(name: string): Promise<Pokemon> {
    try {
      const pokemonData = await this.httpClient.get<PokeApiPokemon>(
        `${apisConfig.pokeapi.endpoints.pokemon}/${name.toLowerCase()}/`
      );

      return Pokemon.create({
        id: pokemonData.id,
        name: pokemonData.name,
        types: pokemonData.types.map(t => ({ name: t.type.name })),
        stats: pokemonData.stats.map(s => ({
          base_stat: s.base_stat,
          stat: { name: s.stat.name }
        })),
        sprites: {
          front_default: pokemonData.sprites.front_default || ''
        },
        height: pokemonData.height,
        weight: pokemonData.weight
      });
    } catch (error) {
      throw new PokeApiError(`Failed to fetch Pokemon ${name}: ${error}`);
    }
  }

  public async getRandomPokemonId(): Promise<number> {
    return Math.floor(Math.random() * 150) + 1;
  }

  public async getPokemonsByType(typeName: string): Promise<Pokemon[]> {
    try {
      const typeData = await this.httpClient.get<{
        pokemon: Array<{ pokemon: { name: string; url: string } }>;
      }>(`${apisConfig.pokeapi.endpoints.types}/${typeName.toLowerCase()}/`);

      const pokemonPromises = typeData.pokemon
        .slice(0, 10)
        .map(p => this.getPokemonByName(p.pokemon.name));

      return Promise.all(pokemonPromises);
    } catch (error) {
      throw new PokeApiError(`Failed to fetch Pokemon by type ${typeName}: ${error}`);
    }
  }

  public async getPopularPokemon(): Promise<Pokemon[]> {
    const popularIds = [1, 6, 9, 25, 94, 150];
    const pokemonPromises = popularIds.map(id => this.getPokemon(id));
    return Promise.all(pokemonPromises);
  }

  public getDesertPokemon(): number[] {
    return [27, 28, 104, 111, 112];
  }

  public getOceanPokemon(): number[] {
    return [7, 8, 9, 54, 55, 72, 73, 86, 87];
  }

  public getIcePokemon(): number[] {
    return [87, 91, 124, 131, 144];
  }

  public getForestPokemon(): number[] {
    return [1, 2, 3, 43, 44, 45, 46, 47];
  }

  public getMechanicalPokemon(): number[] {
    return [81, 82, 100, 101, 137];
  }

  public getHeroicPokemon(): number[] {
    return [25, 6, 9, 150, 249, 250];
  }

  public getDarkPokemon(): number[] {
    return [94, 169, 197, 229, 248];
  }
}
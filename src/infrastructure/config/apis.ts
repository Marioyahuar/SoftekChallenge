import { environment } from './environment';

export const apisConfig = {
  swapi: {
    baseUrl: environment.apis.swapiBaseUrl,
    endpoints: {
      people: '/people',
      planets: '/planets',
      films: '/films',
      species: '/species',
    },
    timeout: 10000,
    retries: 3,
  },
  pokeapi: {
    baseUrl: environment.apis.pokeApiBaseUrl,
    endpoints: {
      pokemon: '/pokemon',
      types: '/type',
      species: '/pokemon-species',
    },
    timeout: 10000,
    retries: 3,
  },
};
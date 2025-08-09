export interface PokeApiPokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  is_default: boolean;
  order: number;
  weight: number;
  abilities: PokeApiAbility[];
  forms: PokeApiForm[];
  game_indices: PokeApiGameIndex[];
  held_items: PokeApiHeldItem[];
  location_area_encounters: string;
  moves: PokeApiMove[];
  species: PokeApiSpecies;
  sprites: PokeApiSprites;
  stats: PokeApiStat[];
  types: PokeApiType[];
}

export interface PokeApiType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokeApiStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokeApiSprites {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
}

export interface PokeApiAbility {
  is_hidden: boolean;
  slot: number;
  ability: {
    name: string;
    url: string;
  };
}

export interface PokeApiForm {
  name: string;
  url: string;
}

export interface PokeApiGameIndex {
  game_index: number;
  version: {
    name: string;
    url: string;
  };
}

export interface PokeApiHeldItem {
  item: {
    name: string;
    url: string;
  };
  version_details: Array<{
    rarity: number;
    version: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokeApiMove {
  move: {
    name: string;
    url: string;
  };
  version_group_details: Array<{
    level_learned_at: number;
    move_learn_method: {
      name: string;
      url: string;
    };
    version_group: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokeApiSpecies {
  name: string;
  url: string;
}
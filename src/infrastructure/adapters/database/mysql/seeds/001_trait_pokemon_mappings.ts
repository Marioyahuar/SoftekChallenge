import { MySQLConnection } from '../connection';

interface TraitMapping {
  traitName: string;
  pokemonId: number;
  weight: number;
  reasoning: string;
  category: 'environment' | 'physical' | 'personality' | 'archetype';
}

const traitMappings: TraitMapping[] = [
  // Environment traits
  { traitName: 'desert', pokemonId: 27, weight: 0.9, reasoning: 'Sandshrew - Ground type that lives in desert environments', category: 'environment' },
  { traitName: 'desert', pokemonId: 28, weight: 0.85, reasoning: 'Sandslash - Evolved form with enhanced desert adaptation', category: 'environment' },
  { traitName: 'desert', pokemonId: 104, weight: 0.8, reasoning: 'Cubone - Ground type that thrives in arid conditions', category: 'environment' },
  { traitName: 'desert', pokemonId: 111, weight: 0.75, reasoning: 'Rhyhorn - Rock/Ground type suited for harsh terrain', category: 'environment' },
  { traitName: 'desert', pokemonId: 112, weight: 0.7, reasoning: 'Rhydon - Evolution that dominates desert landscapes', category: 'environment' },

  { traitName: 'ocean', pokemonId: 7, weight: 0.9, reasoning: 'Squirtle - Water starter, natural ocean dweller', category: 'environment' },
  { traitName: 'ocean', pokemonId: 8, weight: 0.85, reasoning: 'Wartortle - Enhanced aquatic abilities', category: 'environment' },
  { traitName: 'ocean', pokemonId: 9, weight: 0.95, reasoning: 'Blastoise - Ultimate water type evolution', category: 'environment' },
  { traitName: 'ocean', pokemonId: 54, weight: 0.8, reasoning: 'Psyduck - Water type that lives near water bodies', category: 'environment' },
  { traitName: 'ocean', pokemonId: 72, weight: 0.85, reasoning: 'Tentacool - Jellyfish Pokemon of the seas', category: 'environment' },

  { traitName: 'ice', pokemonId: 87, weight: 0.9, reasoning: 'Dewgong - Ice/Water dual type from frigid waters', category: 'environment' },
  { traitName: 'ice', pokemonId: 91, weight: 0.85, reasoning: 'Cloyster - Ice/Water with protective ice shell', category: 'environment' },
  { traitName: 'ice', pokemonId: 124, weight: 0.95, reasoning: 'Jynx - Ice/Psychic humanoid of frozen lands', category: 'environment' },
  { traitName: 'ice', pokemonId: 131, weight: 0.8, reasoning: 'Lapras - Ice/Water gentle giant of cold seas', category: 'environment' },
  { traitName: 'ice', pokemonId: 144, weight: 0.95, reasoning: 'Articuno - Legendary ice bird', category: 'environment' },

  { traitName: 'forest', pokemonId: 1, weight: 0.9, reasoning: 'Bulbasaur - Grass starter, forest dweller', category: 'environment' },
  { traitName: 'forest', pokemonId: 2, weight: 0.85, reasoning: 'Ivysaur - Evolved grass type of the woods', category: 'environment' },
  { traitName: 'forest', pokemonId: 3, weight: 0.95, reasoning: 'Venusaur - Ultimate forest guardian', category: 'environment' },
  { traitName: 'forest', pokemonId: 43, weight: 0.8, reasoning: 'Oddish - Grass/Poison that hides in forests', category: 'environment' },
  { traitName: 'forest', pokemonId: 45, weight: 0.85, reasoning: 'Vileplume - Flower Pokemon of deep woods', category: 'environment' },

  // Physical traits
  { traitName: 'mechanical', pokemonId: 81, weight: 0.95, reasoning: 'Magnemite - Pure Electric/Steel mechanical being', category: 'physical' },
  { traitName: 'mechanical', pokemonId: 82, weight: 0.9, reasoning: 'Magneton - Triple magnetic mechanical evolution', category: 'physical' },
  { traitName: 'mechanical', pokemonId: 100, weight: 0.85, reasoning: 'Voltorb - Mechanical sphere Pokemon', category: 'physical' },
  { traitName: 'mechanical', pokemonId: 101, weight: 0.8, reasoning: 'Electrode - Advanced mechanical evolution', category: 'physical' },
  { traitName: 'mechanical', pokemonId: 137, weight: 0.9, reasoning: 'Porygon - Digital/artificial Pokemon', category: 'physical' },

  { traitName: 'small', pokemonId: 25, weight: 0.8, reasoning: 'Pikachu - Small electric mouse', category: 'physical' },
  { traitName: 'small', pokemonId: 104, weight: 0.85, reasoning: 'Cubone - Small ground type', category: 'physical' },
  { traitName: 'small', pokemonId: 16, weight: 0.75, reasoning: 'Pidgey - Small flying type', category: 'physical' },

  { traitName: 'tall', pokemonId: 6, weight: 0.8, reasoning: 'Charizard - Large fire dragon', category: 'physical' },
  { traitName: 'tall', pokemonId: 150, weight: 0.85, reasoning: 'Mewtwo - Tall psychic legendary', category: 'physical' },
  { traitName: 'tall', pokemonId: 65, weight: 0.7, reasoning: 'Alakazam - Tall psychic humanoid', category: 'physical' },

  { traitName: 'artificial', pokemonId: 137, weight: 0.95, reasoning: 'Porygon - Man-made digital creature', category: 'physical' },
  { traitName: 'artificial', pokemonId: 81, weight: 0.9, reasoning: 'Magnemite - Artificial magnetic being', category: 'physical' },

  // Personality traits
  { traitName: 'heroic', pokemonId: 25, weight: 0.95, reasoning: 'Pikachu - Iconic hero Pokemon', category: 'personality' },
  { traitName: 'heroic', pokemonId: 6, weight: 0.9, reasoning: 'Charizard - Dragon-like protector', category: 'personality' },
  { traitName: 'heroic', pokemonId: 9, weight: 0.85, reasoning: 'Blastoise - Noble water guardian', category: 'personality' },
  { traitName: 'heroic', pokemonId: 150, weight: 0.8, reasoning: 'Mewtwo - Legendary psychic protector', category: 'personality' },

  { traitName: 'dark_side', pokemonId: 94, weight: 0.95, reasoning: 'Gengar - Ghost type with dark presence', category: 'personality' },
  { traitName: 'dark_side', pokemonId: 169, weight: 0.9, reasoning: 'Crobat - Dark evolved poison menace', category: 'personality' },
  { traitName: 'dark_side', pokemonId: 89, weight: 0.85, reasoning: 'Muk - Poison type of darkness', category: 'personality' },

  { traitName: 'wise', pokemonId: 65, weight: 0.9, reasoning: 'Alakazam - Psychic sage with high IQ', category: 'personality' },
  { traitName: 'wise', pokemonId: 150, weight: 0.95, reasoning: 'Mewtwo - Legendary psychic master', category: 'personality' },
  { traitName: 'wise', pokemonId: 97, weight: 0.8, reasoning: 'Hypno - Psychic with ancient wisdom', category: 'personality' },

  { traitName: 'brave', pokemonId: 25, weight: 0.85, reasoning: 'Pikachu - Courageous electric mouse', category: 'personality' },
  { traitName: 'brave', pokemonId: 6, weight: 0.9, reasoning: 'Charizard - Fearless fire dragon', category: 'personality' },

  // Archetype traits
  { traitName: 'droid', pokemonId: 81, weight: 0.95, reasoning: 'Magnemite - Robotic magnetic being', category: 'archetype' },
  { traitName: 'droid', pokemonId: 137, weight: 0.9, reasoning: 'Porygon - Digital artificial intelligence', category: 'archetype' },

  { traitName: 'companion', pokemonId: 25, weight: 0.9, reasoning: 'Pikachu - Ultimate loyal partner', category: 'archetype' },
  { traitName: 'companion', pokemonId: 133, weight: 0.85, reasoning: 'Eevee - Adaptable companion Pokemon', category: 'archetype' },

  { traitName: 'royalty', pokemonId: 150, weight: 0.9, reasoning: 'Mewtwo - Legendary with regal presence', category: 'archetype' },
  { traitName: 'royalty', pokemonId: 144, weight: 0.85, reasoning: 'Articuno - Majestic legendary bird', category: 'archetype' },

  { traitName: 'chosen_one', pokemonId: 150, weight: 0.95, reasoning: 'Mewtwo - Ultimate legendary creation', category: 'archetype' },
  { traitName: 'chosen_one', pokemonId: 25, weight: 0.8, reasoning: 'Pikachu - Chosen electric companion', category: 'archetype' },

  { traitName: 'villain', pokemonId: 94, weight: 0.9, reasoning: 'Gengar - Mischievous ghost antagonist', category: 'archetype' },
  { traitName: 'villain', pokemonId: 150, weight: 0.85, reasoning: 'Mewtwo - Created as ultimate weapon', category: 'archetype' },
];

export async function seedTraitMappings(): Promise<void> {
  const db = MySQLConnection.getInstance();

  try {
    console.log('Starting trait mappings seed...');

    // Clear existing mappings
    await db.execute('DELETE FROM trait_pokemon_mappings');
    console.log('Cleared existing trait mappings');

    // Insert new mappings
    const insertQuery = `
      INSERT INTO trait_pokemon_mappings (trait_name, pokemon_id, weight, reasoning, category)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const mapping of traitMappings) {
      await db.execute(insertQuery, [
        mapping.traitName,
        mapping.pokemonId,
        mapping.weight,
        mapping.reasoning,
        mapping.category,
      ]);
    }

    console.log(`Inserted ${traitMappings.length} trait mappings`);
    console.log('Trait mappings seed completed successfully!');

  } catch (error) {
    console.error('Trait mappings seed failed:', error);
    throw error;
  }
}
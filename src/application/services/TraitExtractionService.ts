import { StarWarsCharacter } from '../../domain/entities/StarWarsCharacter';
import { CharacterTraits } from '../../domain/entities/CharacterTraits';
import { TraitExtractionError } from '../../domain/errors/FusionError';

export class TraitExtractionService {
  public extractTraits(character: StarWarsCharacter): CharacterTraits {
    try {
      const environmentTraits = this.extractEnvironmentTraits(character);
      const physicalTraits = this.extractPhysicalTraits(character);
      const personalityTraits = this.extractPersonalityTraits(character);
      const archetypeTraits = this.extractArchetypeTraits(character);

      return CharacterTraits.create({
        characterId: character.id,
        environmentTraits,
        physicalTraits,
        personalityTraits,
        archetypeTraits,
      });
    } catch (error) {
      throw new TraitExtractionError(
        character.id,
        `Failed to extract traits: ${error}`
      );
    }
  }

  private extractEnvironmentTraits(character: StarWarsCharacter): string[] {
    const traits: string[] = [];
    const climate = character.homeworld.climate.toLowerCase();
    const terrain = character.homeworld.terrain.toLowerCase();

    if (climate.includes('desert') || climate.includes('arid') || terrain.includes('desert')) {
      traits.push('desert');
    }

    if (climate.includes('ocean') || climate.includes('aquatic') || terrain.includes('ocean')) {
      traits.push('ocean');
    }

    if (climate.includes('frozen') || climate.includes('ice') || climate.includes('tundra')) {
      traits.push('ice');
    }

    if (terrain.includes('forest') || terrain.includes('jungle') || terrain.includes('rainforest')) {
      traits.push('forest');
    }

    if (terrain.includes('mountain') || terrain.includes('rocky')) {
      traits.push('mountain');
    }

    if (climate.includes('temperate') || terrain.includes('grasslands')) {
      traits.push('temperate');
    }

    if (terrain.includes('urban') || terrain.includes('cityscape')) {
      traits.push('urban');
    }

    if (terrain.includes('swamp') || terrain.includes('bog')) {
      traits.push('swamp');
    }

    return traits.length > 0 ? traits : ['unknown'];
  }

  private extractPhysicalTraits(character: StarWarsCharacter): string[] {
    const traits: string[] = [];

    if (character.isSmall()) {
      traits.push('small');
    } else if (character.isTall()) {
      traits.push('tall');
    } else {
      traits.push('average_height');
    }

    if (character.isDroid()) {
      traits.push('mechanical');
      traits.push('artificial');
    } else if (character.isHuman()) {
      traits.push('human');
      traits.push('organic');
    } else {
      traits.push('alien');
      traits.push('organic');
    }

    const mass = character.mass.toLowerCase();
    if (mass.includes('unknown') || mass === 'n/a') {
      traits.push('unknown_mass');
    } else {
      const massValue = parseInt(character.mass);
      if (massValue < 50) {
        traits.push('light');
      } else if (massValue > 100) {
        traits.push('heavy');
      } else {
        traits.push('average_weight');
      }
    }

    return traits;
  }

  private extractPersonalityTraits(character: StarWarsCharacter): string[] {
    const traits: string[] = [];
    const name = character.name.toLowerCase();

    const heroicNames = [
      'luke', 'leia', 'han', 'chewbacca', 'obi-wan', 'yoda', 'anakin', 
      'padme', 'qui-gon', 'mace', 'windu', 'lando'
    ];
    
    const darkNames = [
      'vader', 'darth', 'palpatine', 'sidious', 'maul', 'dooku', 
      'grievous', 'tyranus', 'emperor'
    ];

    const wiseNames = [
      'yoda', 'obi-wan', 'kenobi', 'qui-gon', 'jinn', 'mace', 'windu'
    ];

    const rogueNames = [
      'han', 'solo', 'lando', 'calrissian', 'boba', 'fett', 'jango'
    ];

    if (heroicNames.some(heroName => name.includes(heroName))) {
      traits.push('heroic');
      traits.push('brave');
    }

    if (darkNames.some(darkName => name.includes(darkName))) {
      traits.push('dark_side');
      traits.push('intimidating');
    }

    if (wiseNames.some(wiseName => name.includes(wiseName))) {
      traits.push('wise');
      traits.push('patient');
    }

    if (rogueNames.some(rogueName => name.includes(rogueName))) {
      traits.push('roguish');
      traits.push('independent');
    }

    if (character.isDroid()) {
      traits.push('logical');
      traits.push('loyal');
    }

    if (traits.length === 0) {
      traits.push('neutral');
    }

    return traits;
  }

  private extractArchetypeTraits(character: StarWarsCharacter): string[] {
    const traits: string[] = [];
    const name = character.name.toLowerCase();

    if (name.includes('c-3po') || name.includes('r2-d2') || name.includes('bb-8')) {
      traits.push('droid');
      traits.push('companion');
    }

    if (name.includes('princess') || name.includes('leia') || name.includes('senator')) {
      traits.push('royalty');
      traits.push('leader');
    }

    if (name.includes('luke') || name.includes('anakin') || name.includes('rey')) {
      traits.push('chosen_one');
      traits.push('hero');
    }

    if (name.includes('vader') || name.includes('emperor') || name.includes('palpatine')) {
      traits.push('dark_lord');
      traits.push('villain');
    }

    if (name.includes('han') || name.includes('lando') || name.includes('smuggler')) {
      traits.push('smuggler');
      traits.push('pilot');
    }

    if (name.includes('obi-wan') || name.includes('yoda') || name.includes('mace')) {
      traits.push('jedi_master');
      traits.push('mentor');
    }

    if (name.includes('boba') || name.includes('jango') || name.includes('bounty')) {
      traits.push('bounty_hunter');
      traits.push('mercenary');
    }

    if (name.includes('chewbacca') || name.includes('wookiee')) {
      traits.push('warrior');
      traits.push('loyal_friend');
    }

    if (traits.length === 0) {
      traits.push('citizen');
    }

    return traits;
  }
}
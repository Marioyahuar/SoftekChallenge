import Joi from 'joi';

export const fusedDataQuerySchema = Joi.object({
  character: Joi.number().integer().min(1).max(82).optional(),
  strategy: Joi.string().valid('intelligent', 'random', 'theme').default('intelligent'),
  theme: Joi.string().valid('desert', 'ocean', 'forest', 'ice', 'urban', 'mechanical', 'heroic', 'dark_side').optional(),
  limit: Joi.number().integer().min(1).max(10).default(1),
  random: Joi.boolean().default(false),
});

// Schema for trait-pokemon mapping
export const traitMappingSchema = Joi.object({
  type: Joi.string().valid('trait_mapping').required(),
  traitName: Joi.string().required().min(1).max(100).trim(),
  pokemonId: Joi.number().integer().min(1).max(1010).required(),
  weight: Joi.number().min(0).max(1).required(),
  reasoning: Joi.string().required().min(1).max(500).trim(),
  category: Joi.string().valid('environment', 'physical', 'personality', 'archetype').required(),
});

// Schema for adding traits to existing character
export const characterTraitSchema = Joi.object({
  type: Joi.string().valid('character_trait').required(),
  characterId: Joi.number().integer().min(1).required(),
  traitName: Joi.string().required().min(1).max(100).trim(),
  category: Joi.string().valid('environment', 'physical', 'personality', 'archetype').required(),
  reasoning: Joi.string().optional().max(500).trim(),
});

// Schema for adding traits to pokemon
export const pokemonTraitSchema = Joi.object({
  type: Joi.string().valid('pokemon_trait').required(),
  pokemonId: Joi.number().integer().min(1).max(1010).required(),
  traitName: Joi.string().required().min(1).max(100).trim(),
  category: Joi.string().valid('environment', 'physical', 'personality', 'archetype').required(),
  reasoning: Joi.string().optional().max(500).trim(),
});

// Original custom data schema (maintained for backward compatibility)
export const customDataSchema = Joi.object({
  name: Joi.string().required().min(1).max(255).trim(),
  description: Joi.string().required().min(1).max(1000).trim(),
  category: Joi.string().required().min(1).max(100).trim(),
  metadata: Joi.object().optional(),
  tags: Joi.array().items(Joi.string().max(50).trim()).max(10).optional(),
});

// Combined schema for the /almacenar endpoint
export const storeDataSchema = Joi.alternatives().try(
  traitMappingSchema,
  characterTraitSchema,
  pokemonTraitSchema,
  customDataSchema
);

export const historyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('timestamp', 'fusionScore', 'strategy').default('timestamp'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

export const validateQueryParams = (schema: Joi.Schema) => {
  return (queryParams: unknown) => {
    const { error, value } = schema.validate(queryParams, { allowUnknown: false });
    
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return value;
  };
};

export const validateBody = (schema: Joi.Schema) => {
  return (body: unknown) => {
    const { error, value } = schema.validate(body, { allowUnknown: false });
    
    if (error) {
      throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
    }
    
    return value;
  };
};
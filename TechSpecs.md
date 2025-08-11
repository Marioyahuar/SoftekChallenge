# Especificaciones Técnicas - Star Wars Pokemon Fusion API

## Resumen del Proyecto

Desarrollar una API RESTful serverless que combine datos de Star Wars API (SWAPI) y PokeAPI usando un sistema de mapeo inteligente, implementando cache híbrido, autenticación, y almacenamiento persistente en AWS.

## Stack Tecnológico

- **Runtime**: Node.js 20 + TypeScript (strict mode)
- **Framework**: Serverless Framework
- **Base de Datos**: MySQL 8.0 (AWS RDS)
- **Cache**: Redis (AWS ElastiCache)
- **Testing**: Jest + Supertest
- **Autenticación**: AWS Cognito
- **Documentación**: Swagger/OpenAPI 3.0
- **Monitoreo**: CloudWatch + X-Ray

## Arquitectura Hexagonal

```
src/
├── application/                    # Casos de uso y servicios de aplicación
│   ├── use-cases/
│   │   ├── GetFusedDataUseCase.ts
│   │   ├── StoreCustomDataUseCase.ts
│   │   └── GetHistoryUseCase.ts
│   ├── services/
│   │   ├── HybridCacheService.ts
│   │   ├── IntelligentFusionService.ts
│   │   ├── TraitExtractionService.ts
│   │   ├── PokemonMatchingService.ts
│   │   └── DataNormalizationService.ts
│   └── ports/                      # Interfaces (contratos)
│       ├── repositories/
│       │   ├── IFusedDataRepository.ts
│       │   ├── ICustomDataRepository.ts
│       │   ├── ICharacterTraitsRepository.ts
│       │   ├── ITraitMappingRepository.ts
│       │   └── IPokemonCacheRepository.ts
│       └── services/
│           ├── IExternalApiService.ts
│           ├── IFusionAlgorithmService.ts
│           └── ICacheService.ts
├── domain/                         # Entidades y lógica de negocio
│   ├── entities/
│   │   ├── StarWarsCharacter.ts
│   │   ├── Pokemon.ts
│   │   ├── FusedCharacter.ts
│   │   ├── CharacterTraits.ts
│   │   └── CustomData.ts
│   ├── value-objects/
│   │   ├── FusionScore.ts
│   │   ├── CompatibilityLevel.ts
│   │   ├── CacheKey.ts
│   │   └── FusionStrategy.ts
│   └── errors/
│       ├── DomainError.ts
│       ├── FusionError.ts
│       └── ExternalApiError.ts
├── infrastructure/                 # Adaptadores y implementaciones
│   ├── adapters/
│   │   ├── http/
│   │   │   ├── handlers/
│   │   │   │   ├── fusedDataHandler.ts
│   │   │   │   ├── customDataHandler.ts
│   │   │   │   └── historyHandler.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   ├── rateLimitMiddleware.ts
│   │   │   │   ├── validationMiddleware.ts
│   │   │   │   └── errorMiddleware.ts
│   │   │   └── schemas/
│   │   │       └── validation-schemas.ts
│   │   ├── database/
│   │   │   ├── mysql/
│   │   │   │   ├── connection.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── FusedDataRepository.ts
│   │   │   │   │   ├── CustomDataRepository.ts
│   │   │   │   │   ├── CharacterTraitsRepository.ts
│   │   │   │   │   ├── TraitMappingRepository.ts
│   │   │   │   │   └── PokemonCacheRepository.ts
│   │   │   │   └── migrations/
│   │   │   └── redis/
│   │   │       ├── connection.ts
│   │   │       └── CacheRepository.ts
│   │   ├── external-apis/
│   │   │   ├── swapi/
│   │   │   │   ├── SwapiService.ts
│   │   │   │   └── types/
│   │   │   ├── pokeapi/
│   │   │   │   ├── PokeApiService.ts
│   │   │   │   └── types/
│   │   │   └── HttpClient.ts
│   │   └── cache/
│   │       ├── RedisCacheAdapter.ts
│   │       ├── MemoryCacheAdapter.ts
│   │       └── HybridCacheAdapter.ts
│   └── config/
│       ├── database.ts
│       ├── redis.ts
│       ├── apis.ts
│       └── environment.ts
├── shared/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── validators/
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

## Especificaciones de Endpoints

### 1. GET /fusionados

**Funcionalidad**: Fusiona personajes de Star Wars con Pokémon usando algoritmo inteligente.

**Parámetros**:

```typescript
interface FusionParams {
  character?: number; // ID de SWAPI (1-82)
  strategy?: "intelligent" | "random" | "theme";
  theme?:
    | "desert"
    | "ocean"
    | "forest"
    | "ice"
    | "urban"
    | "mechanical"
    | "heroic"
    | "dark_side";
  limit?: number; // 1-10, default: 1
  random?: boolean;
}
```

**Response**:

```typescript
interface FusionResponse {
  id: string;
  timestamp: string;
  fusionStrategy: string;
  data: {
    starWarsCharacter: {
      id: number;
      name: string;
      height: number;
      mass: string;
      homeworld: {
        name: string;
        climate: string;
        terrain: string;
      };
      traits: {
        environmentTraits: string[];
        physicalTraits: string[];
        personalityTraits: string[];
        archetypeTraits: string[];
      };
    };
    pokemonCompanion: {
      id: number;
      name: string;
      types: Array<{ name: string }>;
      stats: Array<{ base_stat: number; stat: { name: string } }>;
      sprites: { front_default: string };
    };
    fusionAnalysis: {
      fusionScore: number; // 0.0-1.0
      fusionReason: string;
      matchingTraits: string[];
      compatibilityLevel: "low" | "medium" | "high" | "perfect";
    };
  };
  metadata: {
    cacheHit: boolean;
    apiCallsMade: number;
    processingTimeMs: number;
  };
}
```

### 2. POST /almacenar

**Funcionalidad**: Almacena datos personalizados del usuario.

**Request Body**:

```typescript
interface CustomDataRequest {
  name: string;
  description: string;
  category: string;
  metadata?: Record<string, any>;
  tags?: string[];
}
```

**Requiere**: Autenticación JWT

### 3. GET /historial

**Funcionalidad**: Retorna historial paginado de fusiones almacenadas.

**Query Parameters**:

- `page`: número (default: 1)
- `limit`: número (default: 10, max: 100)
- `sortBy`: 'timestamp' | 'fusionScore' | 'strategy'
- `order`: 'asc' | 'desc'

**Requiere**: Autenticación JWT

## Esquema de Base de Datos

### Tablas Principales

```sql
-- Personajes SWAPI normalizados
CREATE TABLE swapi_characters (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    height INT,
    mass VARCHAR(50),
    birth_year VARCHAR(50),
    species VARCHAR(255),
    homeworld_id INT,
    gender VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_homeworld (homeworld_id),
    INDEX idx_name (name)
);

-- Planetas SWAPI
CREATE TABLE swapi_planets (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    climate VARCHAR(255),
    terrain VARCHAR(255),
    population VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_climate (climate),
    INDEX idx_terrain (terrain)
);

-- Traits calculados por personaje (corazón del sistema de fusión)
CREATE TABLE character_traits (
    character_id INT PRIMARY KEY,
    environment_traits JSON NOT NULL,
    physical_traits JSON NOT NULL,
    personality_traits JSON NOT NULL,
    archetype_traits JSON NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES swapi_characters(id)
);

-- Mapeos configurables trait → pokemon
CREATE TABLE trait_pokemon_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trait_name VARCHAR(100) NOT NULL,
    pokemon_id INT NOT NULL,
    weight DECIMAL(4,3) DEFAULT 1.000,
    reasoning TEXT,
    category ENUM('environment', 'physical', 'personality', 'archetype') NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_trait_pokemon (trait_name, pokemon_id),
    INDEX idx_trait_active (trait_name, active),
    INDEX idx_weight (weight DESC)
);

-- Cache de datos de Pokémon
CREATE TABLE pokemon_cache (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    types JSON NOT NULL,
    stats JSON NOT NULL,
    sprites JSON,
    height INT,
    weight INT,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_expires_at (expires_at)
);

-- Historial de fusiones (requirement: almacenar para futuras consultas)
CREATE TABLE fused_data (
    id VARCHAR(36) PRIMARY KEY,
    swapi_character_id INT NOT NULL,
    pokemon_id INT NOT NULL,
    fusion_strategy ENUM('intelligent', 'random', 'theme') NOT NULL,
    fusion_score DECIMAL(4,3),
    fusion_reason TEXT NOT NULL,
    matching_traits JSON,
    compatibility_level ENUM('low', 'medium', 'high', 'perfect') NOT NULL,
    full_response JSON NOT NULL,
    request_params JSON,
    user_id VARCHAR(255),
    processing_time_ms INT,
    api_calls_made INT DEFAULT 0,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_strategy (fusion_strategy),
    INDEX idx_user_id (user_id)
);

-- Datos personalizados (endpoint POST /almacenar)
CREATE TABLE custom_data (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    metadata JSON,
    tags JSON,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_user_id (user_id)
);
```

### Datos Semilla para Mapeos

Implementar seeder que inserte mapeos básicos como:

- `desert` → Pokémon IDs [27, 28, 104] (Sandshrew, Sandslash, Cubone)
- `ocean` → Pokémon IDs [7, 8, 9] (Squirtle line)
- `heroic` → Pokémon IDs [25, 6, 150] (Pikachu, Charizard, Mewtwo)
- `mechanical` → Pokémon IDs [81, 137] (Magnemite, Porygon)

## Sistema de Fusión

### Algoritmo de Extracción de Traits

**TraitExtractionService** debe implementar:

1. **Environment Traits**: Analizar `planet.climate` y `planet.terrain`

   - "desert", "arid" → `desert`
   - "ocean", "aquatic" → `ocean`
   - "frozen", "ice" → `ice`
   - "forest", "jungle" → `forest`

2. **Physical Traits**: Analizar `character.height`, `character.mass`, `character.species`

   - height < 150 → `small`
   - height > 200 → `tall`
   - species "Droid" → `mechanical`
   - species "Human" → `human`

3. **Personality Traits**: Análisis basado en `character.name`

   - Nombres como "Luke", "Leia", "Han" → `heroic`
   - Nombres como "Vader", "Palpatine" → `dark_side`
   - Nombres como "Yoda", "Obi-Wan" → `wise`

4. **Archetype Traits**: Categorización de roles
   - "C-3PO", "R2-D2" → `droid`
   - "Princess", "Senator" → `royalty`
   - Análisis contextual por película/era

### Algoritmo de Matching

**PokemonMatchingService** debe implementar:

1. **Scoring System**: Para cada trait del personaje:

   - Buscar mappings en `trait_pokemon_mappings`
   - Sumar scores ponderados por `weight`
   - Aplicar bonus por múltiples matches

2. **Strategy Implementation**:

   - `intelligent`: Usar scoring completo
   - `random`: Selección aleatoria
   - `theme`: Filtrar por tema específico

3. **Fallback Logic**: Si no hay matches perfectos:

   - Usar mappings genéricos (human → Pikachu)
   - Lista curada de Pokémon populares

4. **Fusion Reason Generation**: Explicar por qué se eligió la combinación

## Sistema de Cache Híbrido

### Arquitectura Multi-Nivel

1. **Nivel 1 - Redis Cache Principal**:

   - Key pattern: `fusion:character:{id}:{strategy}`
   - TTL: 30 minutos
   - Almacena respuestas completas

2. **Nivel 2 - Component Cache**:

   - Character traits: `character:traits:{id}` (24h TTL)
   - Pokemon data: `pokemon:data:{id}` (7d TTL)
   - Trait mappings: `mappings:all` (1h TTL)

3. **Nivel 3 - Database Cache**:
   - `character_traits` table
   - `pokemon_cache` table con TTL
   - Backup para cuando Redis no está disponible

### Flujo de Cache

```
1. Request → Check Redis main cache
2. Cache miss → Check component caches (traits, pokemon)
3. Component miss → Check database caches
4. DB miss → Call external APIs
5. Store in all cache levels
6. Return response
```

### Cache Warming

Implementar pre-carga de:

- Personajes populares (IDs 1-10)
- Pokémon populares (1, 6, 9, 25, 94, 150)
- Trait mappings completos

## Flujo del Endpoint /fusionados

### Paso a Paso

1. **Request Validation**: Validar query parameters
2. **Main Cache Check**: `fusion:character:1:intelligent` en Redis
3. **Cache Hit**: Retornar directamente si existe y no expiró
4. **Cache Miss**: Continuar con procesamiento
5. **Get Character Traits**: Memory → Redis → DB → SWAPI
6. **Calculate Missing Traits**: Si no existen, extraer de SWAPI
7. **Get Trait Mappings**: Cache → DB query
8. **Pokemon Matching**: Algoritmo de scoring
9. **Get Pokemon Data**: Cache → DB → PokeAPI
10. **Create Fusion**: Combinar datos + scoring + reason
11. **Store in DB**: Tabla `fused_data` (requirement)
12. **Cache Response**: Redis 30min TTL
13. **Return Response**: JSON formateado

## Configuración Serverless

### serverless.yml

```yaml
service: star-wars-pokemon-api
provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  timeout: 30
  memorySize: 512
  environment:
    DB_HOST: ${env:DB_HOST}
    REDIS_HOST: ${env:REDIS_HOST}
    COGNITO_USER_POOL_ID: ${env:COGNITO_USER_POOL_ID}
  tracing:
    lambda: true
    apiGateway: true

functions:
  fusedData:
    handler: src/infrastructure/adapters/http/handlers/fusedDataHandler.handler
    events:
      - httpApi:
          path: /fusionados
          method: get

  customData:
    handler: src/infrastructure/adapters/http/handlers/customDataHandler.handler
    events:
      - httpApi:
          path: /almacenar
          method: post
          authorizer:
            type: jwt

  history:
    handler: src/infrastructure/adapters/http/handlers/historyHandler.handler
    events:
      - httpApi:
          path: /historial
          method: get
          authorizer:
            type: jwt

resources:
  Resources:
    DatabaseInstance:
      Type: AWS::RDS::DBInstance
      Properties:
        DBInstanceClass: db.t3.micro
        Engine: mysql

    RedisCluster:
      Type: AWS::ElastiCache::CacheCluster
      Properties:
        CacheNodeType: cache.t3.micro
        Engine: redis
```

## Autenticación y Seguridad

### AWS Cognito Setup

- User Pool para gestión de usuarios
- JWT tokens para autenticación stateless
- Proteger endpoints POST /almacenar y GET /historial

### Rate Limiting

- `/fusionados`: 60 requests/minute
- `/almacenar`: 30 requests/minute
- `/historial`: 100 requests/minute

### Input Validation

- Joi schemas para validación de requests
- Sanitización de inputs
- Error handling consistente

## Testing Strategy

### Unit Tests

- Casos de uso con mocks
- Algoritmos de extracción de traits
- Lógica de matching de Pokémon
- Servicios de cache
- Coverage target: >80%

### Integration Tests

- Flow completo de fusión
- Operaciones de base de datos
- Cache multi-nivel
- External API integrations

### E2E Tests

- Endpoints completos con autenticación
- Performance benchmarks
- Error scenarios

### BDD Tests (Gherkin)

```gherkin
Feature: Intelligent Fusion
  Scenario: Desert character gets ground-type Pokemon
    Given a character from desert planet
    When I request intelligent fusion
    Then Pokemon should be ground or rock type
    And fusion score should be > 0.6
```

## Monitoreo y Observabilidad

### CloudWatch Metrics

- Response times por endpoint
- Cache hit ratios
- Error rates 4xx/5xx
- External API call counts

### X-Ray Tracing

- Request tracing end-to-end
- Performance bottlenecks
- External API latencies
- Cache operation timing

### Structured Logging

- Request/response logging
- Error tracking con contexto
- Performance metrics
- Cache analytics

## Variables de Entorno

```bash
# Database
DB_HOST=rds-endpoint
DB_NAME=starwars_pokemon_db
DB_USER=api_user
DB_PASSWORD=secure_password

# Cache
REDIS_HOST=elasticache-endpoint

# External APIs
SWAPI_BASE_URL=https://swapi.info/api/
POKEAPI_BASE_URL=https://pokeapi.co/api/v2

# AWS
COGNITO_USER_POOL_ID=pool-id
AWS_REGION=us-east-1

# App Config
CACHE_TTL_MINUTES=30
API_RATE_LIMIT_RPM=60
LOG_LEVEL=info
```

## Criterios de Éxito

### Performance KPIs

- Response time < 2s para fusiones (cache miss)
- Response time < 200ms para cache hits
- Cache hit ratio > 80%
- Uptime > 99.5%

### Functional Requirements

- ✅ 3 endpoints funcionando
- ✅ Fusión inteligente basada en traits
- ✅ Cache 30 minutos
- ✅ Almacenamiento en DB
- ✅ Autenticación JWT
- ✅ Documentación Swagger

### Bonus Features

- ✅ Rate limiting
- ✅ Monitoreo X-Ray
- ✅ BDD tests
- ✅ Cost optimization

## Notas para Implementación

1. **Dependency Injection**: Usar patrón de inyección para testabilidad
2. **Error Handling**: Middleware centralizado con códigos consistentes
3. **Validation**: Schemas estrictos para requests/responses
4. **Logging**: Structured logs con correlation IDs
5. **Performance**: Optimizar queries DB con indexes apropiados
6. **Security**: Sanitizar inputs, rate limiting, CORS apropiado
7. **Deployment**: CI/CD con tests automatizados antes de deploy

Este documento proporciona las especificaciones completas para que Claude Code implemente la solución serverless con todas las características requeridas y bonus features.

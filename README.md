# Star Wars Pokemon Fusion API 🌟⚡

API RESTful serverless que fusiona personajes de Star Wars con Pokémon usando un sistema inteligente de mapeo basado en traits, implementado con arquitectura hexagonal y desplegado en AWS Lambda.

## 📋 Características Principales

- ✅ **Fusión Inteligente**: Algoritmo de matching basado en traits de personajes
- ✅ **Cache Híbrido**: Redis + MySQL para optimizar performance
- ✅ **Autenticación**: JWT con AWS Cognito
- ✅ **Rate Limiting**: Protección contra abuso por endpoint
- ✅ **Serverless**: Desplegado en AWS Lambda con Serverless Framework
- ✅ **Arquitectura Hexagonal**: Código limpio y mantenible
- ✅ **TypeScript**: Tipado estático y seguridad
- ✅ **Documentación**: OpenAPI/Swagger completa
- ✅ **Monitoreo**: CloudWatch + X-Ray tracing
- ✅ **Tests**: Unitarios e integración con Jest

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Lambda Handler │────│  Use Cases      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   External APIs │    │   Domain Layer  │
                       │  (SWAPI/PokeAPI)│    │   (Entities)    │
                       └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │────│ Cache Service   │────│  Repositories   │────│ MySQL RDS │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └───────────┘
```

## 🚀 Endpoints

### 1. GET /fusionados
Fusiona personajes de Star Wars con Pokémon usando algoritmo inteligente.

**Parámetros:**
- `character` (1-82): ID del personaje SWAPI
- `strategy`: `intelligent` | `random` | `theme`
- `theme`: `desert` | `ocean` | `heroic` | etc.
- `limit` (1-10): Número de fusiones
- `random`: Usar personaje aleatorio

**Rate Limit:** 60 req/min

### 2. POST /almacenar 🔒
Almacena datos personalizados del usuario (requiere autenticación).

**Body:**
```json
{
  "name": "Mi configuración",
  "description": "Descripción detallada",
  "category": "configuracion",
  "metadata": { "key": "value" },
  "tags": ["favorito"]
}
```

**Rate Limit:** 30 req/min

### 3. GET /historial 🔒
Retorna historial paginado de fusiones (requiere autenticación).

**Parámetros:**
- `page`: Número de página
- `limit` (1-100): Elementos por página
- `sortBy`: `timestamp` | `fusionScore` | `strategy`
- `order`: `asc` | `desc`

**Rate Limit:** 100 req/min

## 🛠️ Setup Local

### Prerrequisitos
- Node.js 20+
- Docker y Docker Compose
- AWS CLI configurado
- Serverless Framework

### 1. Instalación
```bash
git clone <repository>
cd SoftekChallenge
npm install
```

### 2. Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Base de Datos y Cache (Docker)
```bash
docker-compose up -d
```

### 4. Migraciones y Seeds
```bash
npm run migration:run
npm run seed:run
```

### 5. Desarrollo Local
```bash
npm run dev
```

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage

# Tests en watch mode
npm run test:watch

# Linting
npm run lint

# Type checking
npm run typecheck
```

## 📦 Deployment

### Development
```bash
serverless deploy --stage dev
```

### Production
```bash
serverless deploy --stage prod
```

Ver [AWS Setup Guide](./docs/aws-setup.md) para configuración completa.

## 🔧 Configuración AWS

### Servicios Requeridos:
- **AWS Cognito**: Autenticación de usuarios
- **MySQL RDS**: Base de datos principal
- **ElastiCache Redis**: Sistema de cache
- **Lambda + API Gateway**: Runtime serverless
- **CloudWatch**: Logging y monitoreo
- **X-Ray**: Tracing distribuido

### Setup Rápido:
```bash
# Crear User Pool de Cognito
aws cognito-idp create-user-pool --pool-name "StarWarsPokemonAPI-UserPool"

# Crear RDS MySQL
aws rds create-db-instance \
  --db-instance-identifier starwars-pokemon-db \
  --db-instance-class db.t3.micro \
  --engine mysql

# Ver docs/aws-setup.md para setup completo
```

## 📊 Sistema de Fusión

### Algoritmo Inteligente
El sistema extrae traits de personajes Star Wars:

**Environment Traits:**
- `desert`: Planetas áridos → Pokémon Ground/Rock
- `ocean`: Planetas acuáticos → Pokémon Water
- `ice`: Planetas helados → Pokémon Ice
- `forest`: Planetas boscosos → Pokémon Grass

**Physical Traits:**
- `small`: Altura < 150cm → Pokémon pequeños
- `tall`: Altura > 200cm → Pokémon grandes
- `mechanical`: Droides → Pokémon Steel/Electric

**Personality Traits:**
- `heroic`: Héroes → Pikachu, Charizard
- `dark_side`: Villanos → Gengar, Crobat
- `wise`: Maestros Jedi → Alakazam, Mewtwo

### Scoring System
```typescript
fusionScore = (matchingTraits * weight) / maxPossibleScore + bonusMultipleMatches
compatibilityLevel = score < 0.3 ? 'low' : score < 0.6 ? 'medium' : score < 0.9 ? 'high' : 'perfect'
```

## 🎯 Performance KPIs

- ⚡ Response time < 2s (cache miss)
- 🚀 Response time < 200ms (cache hit)
- 📈 Cache hit ratio > 80%
- 🔄 Uptime > 99.5%
- 💰 Costo optimizado con Lambda

## 📚 Documentación

- **API Docs**: [Swagger UI](./docs/swagger.yaml)
- **AWS Setup**: [Setup Guide](./docs/aws-setup.md)
- **Architecture**: Ver diagramas en `/docs`

## 🧹 Estructura del Proyecto

```
src/
├── application/              # Casos de uso y servicios de aplicación
│   ├── use-cases/           # GetFusedDataUseCase, StoreCustomDataUseCase
│   ├── services/            # TraitExtraction, PokemonMatching, Cache
│   └── ports/               # Interfaces (contratos)
├── domain/                   # Entidades y lógica de negocio
│   ├── entities/            # StarWarsCharacter, Pokemon, FusedCharacter
│   ├── value-objects/       # FusionScore, CompatibilityLevel
│   └── errors/              # DomainError, FusionError
├── infrastructure/          # Adaptadores e implementaciones
│   ├── adapters/
│   │   ├── http/            # Handlers, middleware, schemas
│   │   ├── database/        # MySQL repositories
│   │   ├── external-apis/   # SWAPI, PokeAPI services
│   │   └── cache/           # Redis, Memory, Hybrid cache
│   └── config/              # Database, Redis, APIs config
├── shared/                   # Tipos, utilidades, constantes
└── tests/                   # Tests unitarios e integración
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Abre Pull Request

## 📝 License

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🎯 Challenge Completado

### ✅ Requerimientos MVP
- [x] API RESTful con Node.js 20 + TypeScript
- [x] Serverless Framework + AWS Lambda
- [x] Integración SWAPI + PokeAPI
- [x] 3 endpoints (fusionados, almacenar, historial)
- [x] Cache 30 minutos
- [x] Base de datos MySQL
- [x] Tests Jest + TypeScript

### ✅ Puntos Bonus
- [x] Autenticación AWS Cognito
- [x] Documentación Swagger/OpenAPI
- [x] Logging CloudWatch + X-Ray
- [x] Rate limiting por endpoint
- [x] Monitorización latencias
- [x] Tests BDD con Gherkin (pendiente)

---

*Desarrollado para Softek Challenge - Backend Node.js/AWS Developer* 🚀
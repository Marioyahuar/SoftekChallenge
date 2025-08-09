-- Planetas SWAPI
CREATE TABLE IF NOT EXISTS swapi_planets (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    climate VARCHAR(255),
    terrain VARCHAR(255),
    population VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_climate (climate),
    INDEX idx_terrain (terrain)
);

-- Personajes SWAPI normalizados
CREATE TABLE IF NOT EXISTS swapi_characters (
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
    INDEX idx_name (name),
    FOREIGN KEY (homeworld_id) REFERENCES swapi_planets(id) ON DELETE SET NULL
);

-- Traits calculados por personaje (corazón del sistema de fusión)
CREATE TABLE IF NOT EXISTS character_traits (
    character_id INT PRIMARY KEY,
    environment_traits JSON NOT NULL,
    physical_traits JSON NOT NULL,
    personality_traits JSON NOT NULL,
    archetype_traits JSON NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES swapi_characters(id) ON DELETE CASCADE
);
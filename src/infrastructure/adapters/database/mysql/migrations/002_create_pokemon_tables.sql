-- Mapeos configurables trait → pokemon
CREATE TABLE IF NOT EXISTS trait_pokemon_mappings (
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
    INDEX idx_weight (weight DESC),
    INDEX idx_category (category)
);

-- Cache de datos de Pokémon
CREATE TABLE IF NOT EXISTS pokemon_cache (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    types JSON NOT NULL,
    stats JSON NOT NULL,
    sprites JSON,
    height INT,
    weight INT,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    INDEX idx_expires_at (expires_at),
    INDEX idx_name (name)
);
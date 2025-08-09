-- Historial de fusiones (requirement: almacenar para futuras consultas)
CREATE TABLE IF NOT EXISTS fused_data (
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
    INDEX idx_user_id (user_id),
    INDEX idx_compatibility (compatibility_level),
    INDEX idx_fusion_score (fusion_score)
);

-- Datos personalizados (endpoint POST /almacenar)
CREATE TABLE IF NOT EXISTS custom_data (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    metadata JSON,
    tags JSON,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
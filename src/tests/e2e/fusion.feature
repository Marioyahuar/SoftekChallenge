# language: en
Feature: Star Wars Pokemon Fusion API

  Background:
    Given the API is running
    And the database is seeded with trait mappings

  Scenario: Get intelligent fusion for Luke Skywalker
    Given I have a Star Wars character with ID 1
    When I request a fusion with strategy "intelligent"
    Then I should receive a fusion response
    And the character should be "Luke Skywalker"
    And the fusion strategy should be "intelligent"
    And the fusion score should be greater than 0
    And the Pokemon should match character traits

  Scenario: Get random fusion
    When I request a fusion with strategy "random"
    Then I should receive a fusion response
    And the fusion strategy should be "random"
    And the response should contain a random Pokemon

  Scenario: Get themed fusion for desert environment
    Given I have a Star Wars character from a desert planet
    When I request a fusion with strategy "theme" and theme "desert"
    Then I should receive a fusion response
    And the Pokemon should be a desert-compatible type
    And the fusion reason should mention desert compatibility

  Scenario: Request multiple fusions
    When I request 3 fusions with strategy "intelligent"
    Then I should receive 3 fusion responses
    And each fusion should have unique IDs

  Scenario: Cache hit scenario
    Given I have requested a fusion for character 1 with strategy "intelligent"
    When I request the same fusion again
    Then the response metadata should indicate a cache hit
    And the response time should be faster

  Scenario: Invalid character ID
    When I request a fusion with character ID 999
    Then I should receive a 400 error
    And the error should mention invalid character ID

  Scenario: Rate limiting
    Given I have made 60 requests to the fusion endpoint in one minute
    When I make another request
    Then I should receive a 429 rate limit error
    And the response should include retry-after header

  Scenario: Store custom data with authentication
    Given I am authenticated with a valid JWT token
    When I store custom data with name "Test Data" and category "test"
    Then I should receive a 201 success response
    And the data should be stored with my user ID

  Scenario: Store custom data without authentication
    When I try to store custom data without authentication
    Then I should receive a 401 unauthorized error

  Scenario: Get fusion history with authentication
    Given I am authenticated with a valid JWT token
    And I have previous fusion history
    When I request my fusion history
    Then I should receive a paginated list of my fusions
    And the list should be ordered by timestamp descending

  Scenario: Get fusion history with pagination
    Given I am authenticated with a valid JWT token
    And I have 25 fusions in my history
    When I request page 2 with limit 10
    Then I should receive fusions 11-20
    And the pagination metadata should show correct values

  Scenario: Fusion with theme filtering
    When I request a fusion with strategy "theme" and theme "heroic"
    Then the Pokemon should be associated with heroic traits
    And the fusion analysis should explain the heroic connection

  Scenario: High compatibility fusion
    Given I have a character with strong trait matches
    When I request an intelligent fusion
    Then the fusion score should be greater than 0.8
    And the compatibility level should be "high" or "perfect"

  Scenario: Performance requirement - cache miss
    When I request a new fusion that is not cached
    Then the response time should be less than 2000ms
    And at least 2 API calls should be made

  Scenario: Performance requirement - cache hit
    Given I have a cached fusion result
    When I request the same fusion
    Then the response time should be less than 200ms
    And no external API calls should be made

  Scenario: Validation errors
    When I request a fusion with invalid parameters
    Then I should receive detailed validation error messages
    And the error code should be "VALIDATION_ERROR"

  Scenario: External API error handling
    Given the SWAPI service is unavailable
    When I request a fusion
    Then I should receive a 502 bad gateway error
    And the error should indicate external service failure
import { FusionScore } from '../../../../domain/value-objects/FusionScore';

describe('FusionScore', () => {
  describe('create', () => {
    it('should create a valid fusion score', () => {
      const score = FusionScore.create(0.75);

      expect(score.getValue()).toBe(0.75);
    });

    it('should throw error for score below 0', () => {
      expect(() => FusionScore.create(-0.1)).toThrow('Fusion score must be between 0 and 1');
    });

    it('should throw error for score above 1', () => {
      expect(() => FusionScore.create(1.1)).toThrow('Fusion score must be between 0 and 1');
    });

    it('should accept boundary values', () => {
      expect(() => FusionScore.create(0)).not.toThrow();
      expect(() => FusionScore.create(1)).not.toThrow();
    });
  });

  describe('level detection', () => {
    it('should identify low scores', () => {
      const score = FusionScore.create(0.2);

      expect(score.isLow()).toBe(true);
      expect(score.isMedium()).toBe(false);
      expect(score.isHigh()).toBe(false);
      expect(score.isPerfect()).toBe(false);
    });

    it('should identify medium scores', () => {
      const score = FusionScore.create(0.5);

      expect(score.isLow()).toBe(false);
      expect(score.isMedium()).toBe(true);
      expect(score.isHigh()).toBe(false);
      expect(score.isPerfect()).toBe(false);
    });

    it('should identify high scores', () => {
      const score = FusionScore.create(0.75);

      expect(score.isLow()).toBe(false);
      expect(score.isMedium()).toBe(false);
      expect(score.isHigh()).toBe(true);
      expect(score.isPerfect()).toBe(false);
    });

    it('should identify perfect scores', () => {
      const score = FusionScore.create(0.95);

      expect(score.isLow()).toBe(false);
      expect(score.isMedium()).toBe(false);
      expect(score.isHigh()).toBe(false);
      expect(score.isPerfect()).toBe(true);
    });
  });

  describe('boundary values', () => {
    it('should handle boundary between low and medium', () => {
      const lowScore = FusionScore.create(0.29);
      const mediumScore = FusionScore.create(0.3);

      expect(lowScore.isLow()).toBe(true);
      expect(mediumScore.isMedium()).toBe(true);
    });

    it('should handle boundary between medium and high', () => {
      const mediumScore = FusionScore.create(0.59);
      const highScore = FusionScore.create(0.6);

      expect(mediumScore.isMedium()).toBe(true);
      expect(highScore.isHigh()).toBe(true);
    });

    it('should handle boundary between high and perfect', () => {
      const highScore = FusionScore.create(0.89);
      const perfectScore = FusionScore.create(0.9);

      expect(highScore.isHigh()).toBe(true);
      expect(perfectScore.isPerfect()).toBe(true);
    });
  });

  describe('toString', () => {
    it('should format score to 3 decimal places', () => {
      const score = FusionScore.create(0.12345);

      expect(score.toString()).toBe('0.123');
    });

    it('should handle whole numbers', () => {
      const score = FusionScore.create(1);

      expect(score.toString()).toBe('1.000');
    });
  });
});
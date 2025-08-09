import { v4 as uuidv4 } from 'uuid';
import { CustomData } from '../../domain/entities/CustomData';
import { ICustomDataRepository } from '../ports/repositories/ICustomDataRepository';

export interface StoreCustomDataRequest {
  name: string;
  description: string;
  category: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  userId: string;
}

export class StoreCustomDataUseCase {
  constructor(private customDataRepository: ICustomDataRepository) {}

  public async execute(request: StoreCustomDataRequest): Promise<CustomData> {
    this.validateRequest(request);

    const customData = CustomData.create({
      id: uuidv4(),
      name: request.name.trim(),
      description: request.description.trim(),
      category: request.category.trim(),
      metadata: request.metadata || {},
      tags: request.tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) || [],
      userId: request.userId,
    });

    await this.customDataRepository.save(customData);
    
    return customData;
  }

  private validateRequest(request: StoreCustomDataRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Name is required and cannot be empty');
    }

    if (request.name.length > 255) {
      throw new Error('Name cannot exceed 255 characters');
    }

    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Description is required and cannot be empty');
    }

    if (request.description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }

    if (!request.category || request.category.trim().length === 0) {
      throw new Error('Category is required and cannot be empty');
    }

    if (request.category.length > 100) {
      throw new Error('Category cannot exceed 100 characters');
    }

    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (request.tags && request.tags.length > 10) {
      throw new Error('Cannot have more than 10 tags');
    }

    if (request.tags) {
      for (const tag of request.tags) {
        if (tag.length > 50) {
          throw new Error('Individual tags cannot exceed 50 characters');
        }
      }
    }

    if (request.metadata) {
      try {
        const serialized = JSON.stringify(request.metadata);
        if (serialized.length > 5000) {
          throw new Error('Metadata cannot exceed 5000 characters when serialized');
        }
      } catch (error) {
        throw new Error('Metadata must be serializable as JSON');
      }
    }
  }
}
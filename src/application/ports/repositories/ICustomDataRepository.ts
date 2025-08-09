import { CustomData } from '../../../domain/entities/CustomData';

export interface ICustomDataRepository {
  save(customData: CustomData): Promise<void>;
  findById(id: string): Promise<CustomData | null>;
  findByUserId(userId: string): Promise<CustomData[]>;
  findByCategory(category: string): Promise<CustomData[]>;
  update(customData: CustomData): Promise<void>;
  delete(id: string): Promise<void>;
}
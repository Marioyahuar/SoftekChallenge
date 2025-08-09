import { FusedCharacter } from '../../../domain/entities/FusedCharacter';

export interface IFusedDataRepository {
  save(fusedCharacter: FusedCharacter): Promise<void>;
  findById(id: string): Promise<FusedCharacter | null>;
  findByUserId(userId: string, page: number, limit: number): Promise<{
    data: FusedCharacter[];
    total: number;
    page: number;
    limit: number;
  }>;
  findAll(page: number, limit: number, sortBy?: string, order?: 'asc' | 'desc'): Promise<{
    data: FusedCharacter[];
    total: number;
    page: number;
    limit: number;
  }>;
  delete(id: string): Promise<void>;
}
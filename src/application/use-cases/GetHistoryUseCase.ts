import { FusedCharacter } from '../../domain/entities/FusedCharacter';
import { IFusedDataRepository } from '../ports/repositories/IFusedDataRepository';

export interface GetHistoryRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  userId?: string;
  isAdmin?: boolean;
}

export interface GetHistoryResponse {
  data: FusedCharacter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class GetHistoryUseCase {
  constructor(private fusedDataRepository: IFusedDataRepository) {}

  public async execute(request: GetHistoryRequest): Promise<GetHistoryResponse> {
    const page = Math.max(1, request.page || 1);
    const limit = Math.min(100, Math.max(1, request.limit || 10));
    const sortBy = this.validateSortBy(request.sortBy || 'timestamp');
    const order = request.order === 'asc' ? 'asc' : 'desc';

    let result;

    if (request.isAdmin) {
      // Admin puede ver todos los registros
      result = await this.fusedDataRepository.findAll(
        page,
        limit,
        sortBy,
        order
      );
    } else if (request.userId) {
      result = await this.fusedDataRepository.findByUserId(
        request.userId,
        page,
        limit
      );
    } else {
      result = await this.fusedDataRepository.findAll(
        page,
        limit,
        sortBy,
        order
      );
    }

    const totalPages = Math.ceil(result.total / limit);

    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  private validateSortBy(sortBy: string): string {
    const allowedSortFields = ['timestamp', 'fusionScore', 'strategy'];
    const mappedFields = {
      timestamp: 'created_at',
      fusionScore: 'fusion_score',
      strategy: 'fusion_strategy',
    };

    if (!allowedSortFields.includes(sortBy)) {
      throw new Error(
        `Invalid sortBy field. Allowed values: ${allowedSortFields.join(', ')}`
      );
    }

    return mappedFields[sortBy as keyof typeof mappedFields] || 'created_at';
  }
}
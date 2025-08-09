import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiTimeoutError, ApiRateLimitError } from '../../../domain/errors/ExternalApiError';

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(private config: HttpClientConfig, private apiName: string) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.code === 'ECONNABORTED') {
          throw new ApiTimeoutError(this.apiName);
        }

        if (error.response?.status === 429) {
          throw new ApiRateLimitError(this.apiName);
        }

        if (error.response?.status >= 500 && this.config.retries > 0) {
          return this.retryRequest(error.config);
        }

        throw error;
      }
    );
  }

  private async retryRequest(config: AxiosRequestConfig, attempt = 1): Promise<AxiosResponse> {
    if (attempt > this.config.retries) {
      throw new Error(`Max retries exceeded for ${this.apiName}`);
    }

    await this.delay(1000 * attempt);
    
    try {
      return await this.axiosInstance.request(config);
    } catch (error) {
      return this.retryRequest(config, attempt + 1);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }
}
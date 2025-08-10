import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { environment } from '../../../config/environment';

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  sub?: string;
  username?: string;
}

export class AuthMiddleware {
  private cognitoClient: CognitoIdentityProviderClient;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: environment.aws.region,
    });
  }

  public async authenticateUser(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header format. Expected: Bearer <token>');
    }

    const token = authHeader.substring(7);

    try {
      // En desarrollo, permitir tokens especiales
      if (environment.app.nodeEnv === 'development' || environment.aws.cognitoUserPoolId === 'local-dev-pool') {
        if (token === 'admin') {
          return {
            userId: 'admin',
            email: 'admin@example.com',
            sub: 'admin',
            username: 'admin',
          };
        }
        if (token === 'cualquier-token' || token.startsWith('dev-')) {
          return {
            userId: 'dev-user-123',
            email: 'dev@example.com',
            sub: 'dev-user-123',
            username: 'dev-user',
          };
        }
      }

      const decodedToken = jwt.decode(token, { complete: true }) as any;

      if (!decodedToken) {
        throw new Error('Invalid token format');
      }

      const userInfo = await this.validateCognitoToken(token);

      return {
        userId: userInfo.sub || decodedToken.payload.sub,
        email: userInfo.email,
        sub: userInfo.sub,
        username: userInfo.username,
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  private async validateCognitoToken(accessToken: string): Promise<any> {
    // Development mode - skip real Cognito validation
    if (environment.app.nodeEnv === 'development' || environment.aws.cognitoUserPoolId === 'local-dev-pool') {
      console.log('Development mode: bypassing Cognito validation');
      return {
        sub: 'dev-user-123',
        username: 'dev-user',
        email: 'dev@example.com',
      };
    }

    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.cognitoClient.send(command);

      const userAttributes = response.UserAttributes?.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      return {
        sub: response.Username,
        username: response.Username,
        email: userAttributes.email,
        ...userAttributes,
      };
    } catch (error) {
      console.error('Cognito token validation failed:', error);
      throw new Error('Token validation failed');
    }
  }

  public extractUserIdFromEvent(event: APIGatewayProxyEvent): string {
    const authContext = event.requestContext.authorizer;
    
    if (authContext && authContext.claims) {
      return authContext.claims.sub || authContext.claims.username;
    }

    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token) as any;
      return decoded?.sub || decoded?.username || 'unknown';
    }

    return 'anonymous';
  }
}

export const withAuthentication = (
  handler: (event: APIGatewayProxyEvent, user: AuthenticatedUser) => Promise<any>,
  authMiddleware = new AuthMiddleware()
) => {
  return async (event: APIGatewayProxyEvent) => {
    const user = await authMiddleware.authenticateUser(event);
    return await handler(event, user);
  };
};
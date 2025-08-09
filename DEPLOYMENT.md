# Deployment Guide - Star Wars Pokemon Fusion API

## Quick Start

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configurations

# 3. Start services (Docker required)
docker-compose up -d

# 4. Run migrations and seeds
npm run migration:run
npm run seed:run

# 5. Start development server
npm run dev
```

### AWS Deployment
```bash
# 1. Configure AWS CLI
aws configure

# 2. Setup AWS resources (see docs/aws-setup.md)
# - Create Cognito User Pool
# - Create RDS MySQL instance  
# - Create ElastiCache Redis cluster

# 3. Deploy to development
serverless deploy --stage dev

# 4. Deploy to production
serverless deploy --stage prod
```

## Environment Variables

Required for deployment:

```bash
# Database
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_NAME=starwars_pokemon_db
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_PORT=3306

# Redis
REDIS_HOST=your-elasticache-endpoint.region.cache.amazonaws.com
REDIS_PORT=6379

# AWS Cognito
COGNITO_USER_POOL_ID=your-cognito-user-pool-id
AWS_REGION=us-east-1

# Application
CACHE_TTL_MINUTES=30
API_RATE_LIMIT_RPM=60
LOG_LEVEL=info
```

## Testing

```bash
# Unit tests
npm test

# Integration tests  
npm run test:integration

# Coverage report
npm run test:coverage

# Linting
npm run lint
npm run typecheck
```

## Performance Targets

- ⚡ Response time < 2s (cache miss)
- 🚀 Response time < 200ms (cache hit) 
- 📈 Cache hit ratio > 80%
- 🔄 Uptime > 99.5%

## Monitoring

- **CloudWatch**: Automated logging and metrics
- **X-Ray**: Distributed tracing 
- **Custom Metrics**: Performance and business metrics
- **Alarms**: Error rate and response time alerts

## Security

- 🔐 JWT Authentication with AWS Cognito
- 🛡️ Rate limiting per endpoint
- 🔍 Input validation and sanitization  
- 📝 Security event logging
- 🌐 CORS configuration

## Scaling

The serverless architecture automatically scales based on demand:

- **Lambda**: Auto-scaling based on request volume
- **RDS**: Can be upgraded to larger instances
- **Redis**: ElastiCache cluster scaling
- **API Gateway**: Built-in scaling and throttling

## Cost Optimization

- Lambda reserved concurrency limits
- RDS instance right-sizing
- ElastiCache appropriate node types
- CloudWatch log retention policies
- X-Ray sampling rates

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check security groups allow Lambda → RDS
   - Verify database credentials
   - Check VPC configuration if using

2. **Redis Connection Issues**  
   - Verify ElastiCache security groups
   - Check Redis endpoint configuration
   - Ensure Lambda has network access

3. **Authentication Failures**
   - Verify Cognito User Pool configuration
   - Check JWT token validity
   - Review IAM permissions

4. **Rate Limiting Issues**
   - Monitor rate limit metrics
   - Adjust limits in configuration
   - Implement backoff strategies

### Monitoring Commands

```bash
# View Lambda logs
serverless logs -f fusedData --stage prod

# View all function logs  
serverless logs --stage prod

# Monitor metrics
aws cloudwatch get-metric-statistics \
  --namespace "StarWarsPokemonAPI" \
  --metric-name "ResponseTime" \
  --dimensions Name=Endpoint,Value=/fusionados \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## Rollback Strategy

```bash
# List deployments
serverless deploy list --stage prod

# Rollback to previous version
serverless rollback --timestamp TIMESTAMP --stage prod
```

## Health Checks

The API includes built-in health monitoring:

- Response time tracking
- Error rate monitoring  
- Cache hit ratio measurement
- External API availability
- Database connection status
- Memory usage tracking

## Support

For deployment issues:
- Check CloudWatch logs
- Review X-Ray traces
- Monitor custom metrics
- Use structured logging for debugging

---

**Note**: This API follows AWS Well-Architected Framework principles for reliability, security, cost optimization, and performance efficiency.
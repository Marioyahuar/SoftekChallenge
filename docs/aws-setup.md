# AWS Infrastructure Setup Guide

## Prerequisites
- AWS CLI configured with appropriate permissions
- Serverless Framework installed globally
- Node.js 20+ installed

## 1. AWS Cognito User Pool Setup

### Create User Pool
```bash
aws cognito-idp create-user-pool \
  --pool-name "StarWarsPokemonAPI-UserPool" \
  --policies PasswordPolicy='{MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --region us-east-1
```

### Create User Pool Client
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <USER_POOL_ID> \
  --client-name "StarWarsPokemonAPI-Client" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --read-attributes email \
  --write-attributes email \
  --region us-east-1
```

### Test User Creation
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com \
  --temporary-password "TempPassword123!" \
  --region us-east-1
```

## 2. RDS MySQL Database Setup

### Create DB Subnet Group
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name starwars-pokemon-subnet-group \
  --db-subnet-group-description "Subnet group for Star Wars Pokemon API" \
  --subnet-ids subnet-xxxxxx subnet-yyyyyy \
  --region us-east-1
```

### Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier starwars-pokemon-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --db-name starwars_pokemon_db \
  --db-subnet-group-name starwars-pokemon-subnet-group \
  --vpc-security-group-ids sg-xxxxxx \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted \
  --region us-east-1
```

## 3. ElastiCache Redis Setup

### Create Cache Subnet Group
```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name starwars-pokemon-cache-subnet \
  --cache-subnet-group-description "Cache subnet group for Star Wars Pokemon API" \
  --subnet-ids subnet-xxxxxx subnet-yyyyyy \
  --region us-east-1
```

### Create Redis Cluster
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id starwars-pokemon-cache \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --cache-subnet-group-name starwars-pokemon-cache-subnet \
  --security-group-ids sg-xxxxxx \
  --region us-east-1
```

## 4. Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_NAME=starwars_pokemon_db
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_PORT=3306

# Redis
REDIS_HOST=your-elasticache-endpoint.region.cache.amazonaws.com
REDIS_PORT=6379

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
AWS_REGION=us-east-1

# External APIs
SWAPI_BASE_URL=https://swapi.dev/api
POKEAPI_BASE_URL=https://pokeapi.co/api/v2

# Application
CACHE_TTL_MINUTES=30
API_RATE_LIMIT_RPM=60
LOG_LEVEL=info
```

## 5. Database Migration and Seeding

### Run Migrations
```bash
npm run migration:run
```

### Run Seeds
```bash
npm run seed:run
```

## 6. Deployment

### Deploy to AWS
```bash
serverless deploy --stage prod
```

### Deploy to Development
```bash
serverless deploy --stage dev
```

## 7. Security Group Configuration

### Lambda Security Group (Outbound)
- Port 443 (HTTPS) to 0.0.0.0/0 for external API calls
- Port 3306 (MySQL) to RDS security group
- Port 6379 (Redis) to ElastiCache security group

### RDS Security Group (Inbound)
- Port 3306 (MySQL) from Lambda security group

### ElastiCache Security Group (Inbound)
- Port 6379 (Redis) from Lambda security group

## 8. IAM Roles and Policies

The Serverless Framework will automatically create the necessary IAM roles. Additional permissions may be needed for:

- CloudWatch Logs
- X-Ray Tracing
- Cognito User Pool access
- VPC networking (if using VPC)

## 9. Monitoring Setup

### CloudWatch Alarms
```bash
# Lambda error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "StarWarsPokemonAPI-ErrorRate" \
  --alarm-description "Monitor Lambda error rate" \
  --metric-name "Errors" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions Name=FunctionName,Value=star-wars-pokemon-api-prod-fusedData \
  --evaluation-periods 2 \
  --region us-east-1
```

## 10. API Testing

### Test Fusion Endpoint
```bash
curl -X GET "https://your-api-gateway-url/fusionados?character=1&strategy=intelligent"
```

### Test Custom Data (Requires Authentication)
```bash
curl -X POST "https://your-api-gateway-url/almacenar" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Data","description":"Test description","category":"test"}'
```

### Test History (Requires Authentication)
```bash
curl -X GET "https://your-api-gateway-url/historial" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 11. Cost Optimization

### Lambda Optimization
- Use provisioned concurrency for consistent performance
- Set appropriate memory allocation (512MB recommended)
- Set timeout to 30 seconds max

### Database Optimization
- Use db.t3.micro for development
- Enable Multi-AZ for production
- Set appropriate backup retention

### Cache Optimization
- Use cache.t3.micro for development
- Monitor cache hit rates
- Set appropriate TTL values

## 12. Troubleshooting

### Common Issues

1. **Lambda timeout**: Increase timeout in serverless.yml
2. **Database connection**: Check security groups and VPC configuration
3. **Authentication errors**: Verify Cognito configuration
4. **High latency**: Check cache hit rates and database queries

### Logs and Debugging

```bash
# View Lambda logs
serverless logs -f fusedData --stage prod

# View all functions logs
serverless logs --stage prod
```
#!/usr/bin/env node

/**
 * Script para probar X-Ray y CloudWatch en desarrollo y producción
 */

const axios = require('axios');

// Configuración
const LOCAL_URL = 'http://localhost:3000';
const PROD_URL = 'https://9z1lqd8drf.execute-api.us-east-2.amazonaws.com/dev'; // Reemplazar con tu URL real

const DEV_TOKEN = 'admin'; // Token de desarrollo
const PROD_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Token real JWT de Cognito

async function testEndpoint(baseUrl, token, testName) {
  console.log(`\n🧪 Testing ${testName}...`);
  console.log(`URL: ${baseUrl}/fusionados`);
  
  try {
    const startTime = Date.now();
    
    const response = await axios.get(`${baseUrl}/fusionados`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'MonitoringTest/1.0'
      },
      params: {
        character: 1,
        strategy: 'intelligent'
      }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Headers:`);
    console.log(`   - X-Processing-Time: ${response.headers['x-processing-time']}`);
    console.log(`   - X-Request-ID: ${response.headers['x-request-id']}`);
    console.log(`   - X-RateLimit-Remaining: ${response.headers['x-ratelimit-remaining']}`);
    
    if (response.data.metadata) {
      console.log(`💾 Cache Hit: ${response.data.metadata.cacheHit}`);
      console.log(`🔍 API Calls: ${response.data.metadata.apiCallsMade}`);
    }
    
    return { success: true, duration, response: response.data };
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || 'Network'} - ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

async function testMultipleRequests(baseUrl, token, count = 5) {
  console.log(`\n🔄 Testing ${count} consecutive requests for caching...`);
  
  const results = [];
  
  for (let i = 1; i <= count; i++) {
    console.log(`Request ${i}/${count}:`);
    const result = await testEndpoint(baseUrl, token, `Request ${i}`);
    results.push(result);
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Analizar resultados de cache
  let cacheHits = 0;
  let cacheMisses = 0;
  
  results.forEach((result, index) => {
    if (result.success && result.response.metadata) {
      if (result.response.metadata.cacheHit) {
        cacheHits++;
      } else {
        cacheMisses++;
      }
    }
  });
  
  console.log(`\n📈 Cache Analysis:`);
  console.log(`   - Cache Hits: ${cacheHits}`);
  console.log(`   - Cache Misses: ${cacheMisses}`);
  console.log(`   - Hit Rate: ${((cacheHits / results.length) * 100).toFixed(1)}%`);
}

async function main() {
  console.log('🚀 AWS X-Ray and CloudWatch Monitoring Test');
  console.log('='.repeat(50));
  
  // Test local development
  console.log('\n📍 LOCAL DEVELOPMENT TEST');
  await testEndpoint(LOCAL_URL, DEV_TOKEN, 'Local Development');
  await testMultipleRequests(LOCAL_URL, DEV_TOKEN, 3);
  
  // Test production (uncomment when ready)
  /*
  console.log('\n☁️  PRODUCTION TEST');
  await testEndpoint(PROD_URL, PROD_TOKEN, 'Production AWS');
  await testMultipleRequests(PROD_URL, PROD_TOKEN, 3);
  */
  
  console.log('\n🔍 What to check:');
  console.log('');
  console.log('📊 CloudWatch Metrics:');
  console.log('   - AWS Console > CloudWatch > Metrics > StarWarsPokemon/API');
  console.log('   - Look for: ResponseTime, FusionProcessingTime, CacheHitRate');
  console.log('');
  console.log('🔍 X-Ray Traces:');
  console.log('   - AWS Console > X-Ray > Traces');
  console.log('   - Look for: FusedDataHandler traces with SWAPI subsegments');
  console.log('');
  console.log('📋 CloudWatch Logs:');
  console.log('   - AWS Console > CloudWatch > Log groups > /aws/lambda/star-wars-pokemon-api-dev-fusionados');
  console.log('   - Look for: [CloudWatch] and [X-Ray Dev] log entries');
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, testMultipleRequests };
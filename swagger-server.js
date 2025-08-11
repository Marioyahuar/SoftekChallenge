const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');

const app = express();
const port = 3001;

try {
  // Read and parse the YAML file
  const yamlFile = fs.readFileSync('./docs/swagger.yaml', 'utf8');
  const swaggerDocument = YAML.parse(yamlFile);

  // Setup Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Star Wars Pokemon Fusion API',
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  // Root redirect
  app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });

  app.listen(port, () => {
    console.log(`📖 Swagger UI disponible en: http://localhost:${port}/api-docs`);
    console.log(`🎯 Endpoints de tu API:`);
    console.log(`   - GET  https://d7mdlucd9f.execute-api.us-east-2.amazonaws.com/fusionados`);
    console.log(`   - POST https://d7mdlucd9f.execute-api.us-east-2.amazonaws.com/almacenar`);
    console.log(`   - GET  https://d7mdlucd9f.execute-api.us-east-2.amazonaws.com/historial`);
  });
} catch (error) {
  console.error('Error loading Swagger documentation:', error.message);
}
const crypto = require("crypto");

// Configuración - CAMBIA ESTOS VALORES
const USERNAME = "marioyahuar@gmail.com";
const PASSWORD = "adminC@gnito1";
const CLIENT_ID = "14qjcibk8s5ma1lv94sciqjgu9";
const CLIENT_SECRET = "1u7rt1s9msdgqsbq90qv66u6nfohu9u4r6q9hr2ekgip1m0bjf92"; // Reemplázalo
const USER_POOL_ID = "us-east-2_WMoVpxe1F";
const REGION = "us-east-2";

// Función para generar SECRET_HASH
function generateSecretHash(username, clientId, clientSecret) {
  const message = username + clientId;
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(message)
    .digest("base64");
}

// Función para obtener token
async function getToken() {
  try {
    const {
      CognitoIdentityProviderClient,
      AdminInitiateAuthCommand,
      AdminRespondToAuthChallengeCommand
    } = require("@aws-sdk/client-cognito-identity-provider");

    const client = new CognitoIdentityProviderClient({ region: REGION });

    const secretHash = generateSecretHash(USERNAME, CLIENT_ID, CLIENT_SECRET);

    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      AuthParameters: {
        USERNAME: USERNAME,
        PASSWORD: PASSWORD,
        SECRET_HASH: secretHash,
      },
    });

    const result = await client.send(command);

    if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      console.log('🔧 Cambiando contraseña temporal...');
      
      const challengeCommand = new AdminRespondToAuthChallengeCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeResponses: {
          USERNAME: USERNAME,
          NEW_PASSWORD: PASSWORD, // Usar la misma contraseña
          SECRET_HASH: secretHash
        },
        Session: result.Session
      });

      const challengeResult = await client.send(challengeCommand);
      
      console.log("🎉 TOKEN GENERADO:");
      console.log("AccessToken:", challengeResult.AuthenticationResult.AccessToken);
      console.log("\n📋 Para Postman:");
      console.log("Authorization: Bearer", challengeResult.AuthenticationResult.AccessToken);
    } else {
      console.log("🎉 TOKEN GENERADO:");
      console.log("AccessToken:", result.AuthenticationResult.AccessToken);
      console.log("\n📋 Para Postman:");
      console.log("Authorization: Bearer", result.AuthenticationResult.AccessToken);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

getToken();

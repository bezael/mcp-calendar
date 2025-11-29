/**
 * Script para obtener el refresh_token de Google OAuth2
 * 
 * Uso:
 *   1. Configura las variables en el archivo .env
 *   2. Ejecuta: npm run get-token
 *   3. Abre la URL en el navegador y autoriza
 *   4. El refresh_token se mostrará en la consola
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';

// ============================================
// Cargar credenciales desde .env
// ============================================
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

// Validar que existan las credenciales
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ ERROR: Faltan variables de entorno');
  console.error('=========================================\n');
  console.error('Asegúrate de tener un archivo .env con:');
  console.error('  GOOGLE_CLIENT_ID=tu-client-id');
  console.error('  GOOGLE_CLIENT_SECRET=tu-client-secret');
  console.error('  GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback');
  console.error('\nSi no tienes estas credenciales, créalas en:');
  console.error('  https://console.cloud.google.com/apis/credentials\n');
  process.exit(1);
}

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function main(): Promise<void> {
  // Generar URL de autorización
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n========================================');
  console.log('🔐 OBTENER REFRESH TOKEN DE GOOGLE');
  console.log('========================================\n');
  console.log('📋 Configuración detectada:');
  console.log(`   Client ID: ${CLIENT_ID.substring(0, 20)}...`);
  console.log(`   Redirect URI: ${REDIRECT_URI}\n`);
  console.log('----------------------------------------\n');
  console.log('1. Abre esta URL en tu navegador:\n');
  console.log(`   ${authUrl}\n`);
  console.log('2. Inicia sesión con tu cuenta de Google');
  console.log('3. Si ves "Access blocked", ve a Google Cloud Console:');
  console.log('   → APIs y servicios → Pantalla de consentimiento OAuth');
  console.log('   → Usuarios de prueba → Añade tu email');
  console.log('4. Autoriza la aplicación\n');
  console.log('⏳ Esperando autorización...\n');

  // Crear servidor temporal para recibir el callback
  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url || '', true);
      
      if (parsedUrl.pathname === '/oauth2callback') {
        const code = parsedUrl.query.code as string;
        const error = parsedUrl.query.error as string;
        
        if (error) {
          console.error(`\n❌ Error de autorización: ${error}`);
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>❌ Error: ${error}</h1><p>Revisa la configuración de OAuth en Google Cloud Console</p>`);
          setTimeout(() => process.exit(1), 1000);
          return;
        }
        
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>❌ Error: No se recibió código de autorización</h1>');
          return;
        }

        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n========================================');
        console.log('✅ ¡TOKENS OBTENIDOS EXITOSAMENTE!');
        console.log('========================================\n');
        
        console.log('📋 Añade esta línea a tu archivo .env:\n');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
        
        console.log('========================================');
        console.log('🔑 REFRESH TOKEN:');
        console.log('========================================');
        console.log(`\n${tokens.refresh_token}\n`);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>MCP Calendar - Autorización Exitosa</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                     max-width: 600px; margin: 50px auto; padding: 20px; background: #1a1a2e; color: #eee; }
              .success { background: #16213e; padding: 20px; border-radius: 10px; border-left: 4px solid #0f0; }
              code { background: #0f3460; padding: 2px 8px; border-radius: 4px; display: block; 
                     margin: 10px 0; overflow-wrap: break-word; font-size: 12px; }
              h1 { color: #0f0; }
              .token { background: #e94560; color: #fff; padding: 10px; border-radius: 5px; 
                       word-break: break-all; font-family: monospace; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>✅ ¡Autorización Exitosa!</h1>
              <p>Ya puedes cerrar esta ventana y revisar la consola.</p>
              <h3>Tu Refresh Token:</h3>
              <div class="token">${tokens.refresh_token}</div>
              <h3>Añade esto a tu .env:</h3>
              <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</code>
            </div>
          </body>
          </html>
        `);

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 2000);
      }
    } catch (error) {
      console.error('Error al obtener tokens:', error);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>❌ Error</h1><pre>${error}</pre>`);
    }
  });

  server.listen(3000, () => {
    console.log('🌐 Servidor escuchando en http://localhost:3000');
  });
}

main().catch(console.error);

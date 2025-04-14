import { startServer } from './mcp/memoryBankMcp.js';

// Ana fonksiyon
async function main() {
  console.log('Memory Bank MCP uygulaması başlatılıyor...');
  
  try {
    // MCP sunucusunu başlat
    await startServer();
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
}

// Uygulamayı başlat
main().catch(error => {
  console.error('Kritik hata:', error);
  process.exit(1);
}); 
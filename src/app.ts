import MySQLStorageClient from "./storage/mysql-storage-client";
import BaileysWhatsappClient from "./whatsapp/baileys/baileys-whatsapp-client";

async function runApp() {
  const storageClient = new MySQLStorageClient("localhost", 3306, "root", "9231", "wwebjs-api");
  const whatsappClient = await BaileysWhatsappClient.build("develop", 1, "develop", storageClient);

  console.log("WhatsApp client initialized:", whatsappClient.sessionId);
}

runApp().catch((error) => {
  console.error("Error running app:", error);
});

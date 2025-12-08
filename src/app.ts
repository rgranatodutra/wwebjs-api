import MySQLDataClient from "./modules/data/mysql-data-client";
import BaileysWhatsappClient from "./modules/whatsapp/clients/baileys-client/baileys-whatsapp-client";

async function runApp() {
  const storageClient = new MySQLDataClient("localhost", 3306, "root", "9231", "wwebjs-api");
  const whatsappClient = await BaileysWhatsappClient.build("develop", 1, "develop", storageClient);

  console.log("WhatsApp client initialized:", whatsappClient.sessionId);
}

runApp().catch((error) => {
  console.error("Error running app:", error);
});

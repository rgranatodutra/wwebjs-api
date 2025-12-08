import { Logger } from "@in.pulse-crm/utils";
import MySQLDataClient from "./modules/data/mysql-data-client";
import HttpWppEventEmitter from "./modules/events/emitter/http-emitter";
import BaileysWhatsappClient from "./modules/whatsapp/clients/baileys-client/baileys-whatsapp-client";
import "dotenv/config";

async function runApp() {
  const endpoints = process.env["WPP_EVENT_ENDPOINTS"]?.split(",");
  const mysqlHost = process.env["MYSQL_HOST"] || "localhost";
  const mysqlPort = parseInt(process.env["MYSQL_PORT"] || "3306", 10);
  const mysqlUser = process.env["MYSQL_USER"];
  const mysqlPassword = process.env["MYSQL_PASSWORD"];
  const mysqlDatabase = process.env["MYSQL_DATABASE"] || "wwebjs-api";
  const instanceName = process.env["INSTANCE_NAME"];
  const clientId = process.env["CLIENT_ID"] ? parseInt(process.env["CLIENT_ID"], 10) : null;
  const sessionId =
    process.env["SESSION_ID"] || (instanceName && clientId !== null ? `${instanceName}-${clientId}` : null);

  if (!mysqlUser || !mysqlPassword) {
    throw new Error("MYSQL_USER or MYSQL_PASSWORD environment variable is not set");
  }

  if (!endpoints || endpoints.length === 0) {
    throw new Error("WPP_EVENT_ENDPOINTS environment variable is not set or empty");
  }

  if (!instanceName) {
    throw new Error("INSTANCE_NAME environment variable is not set");
  }

  if (clientId === null || isNaN(clientId)) {
    throw new Error("CLIENT_ID environment variable is not set or invalid");
  }

  if (!sessionId) {
    throw new Error("SESSION_ID environment variable is not set and cannot be derived");
  }

  const storageClient = new MySQLDataClient(mysqlHost, mysqlPort, mysqlUser, mysqlPassword, mysqlDatabase);
  const eventEmitter = new HttpWppEventEmitter(endpoints);
  await BaileysWhatsappClient.build(sessionId, clientId, instanceName, storageClient, eventEmitter);

  Logger.info("WhatsApp client initialized successfully. Client ID: " + clientId);
}

runApp().catch((error) => {
  console.error("Error running app:", error);
});

# WhatsApp API Express

API REST completa para gerenciar mensagens do WhatsApp via Baileys.

## 📋 Endpoints Disponíveis

### Health & Status
- `GET /api/health` - Status da API
- `GET /api/ping` - Simple ping

### Messages
- `POST /api/messages/send-text` - Enviar mensagem de texto
- `POST /api/messages/send-file` - Enviar arquivo
- `PUT /api/messages/edit` - Editar mensagem
- `DELETE /api/messages/{messageId}` - Deletar/revogar mensagem

### WhatsApp
- `POST /api/whatsapp/validate` - Validar número WhatsApp
- `GET /api/whatsapp/validate?phone=...` - Validar (query param)
- `GET /api/whatsapp/avatar/{phone}` - Obter avatar
- `POST /api/whatsapp/avatar` - Obter avatar (POST)
- `GET /api/whatsapp/status` - Status da conexão

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env`:

```env
# WhatsApp Config
INSTANCE_NAME=my-instance
CLIENT_ID=1
SESSION_ID=my-instance-1

# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=wwebjs-api

# API
PORT=3000
API_KEY=your-secret-key-here  # Optional
WPP_EVENT_ENDPOINTS=http://localhost:8080/webhook
```

### 3. Iniciar Servidor

```bash
npm start
```

A API estará disponível em `http://localhost:3000`

---

## 📚 Exemplos de Uso

### Enviar Mensagem de Texto

```bash
curl -X POST http://localhost:3000/api/messages/send-text \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-here" \
  -d '{
    "phone": "5511999999999",
    "message": "Olá! Tudo bem?",
    "isGroup": false
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Text message sent successfully",
  "data": {
    "id": "3EB0612D0E32E2296C63",
    "fromMe": true,
    "from": "5511988888888",
    "to": "5511999999999",
    "body": "Olá! Tudo bem?",
    "timestamp": 1703001600000,
    "type": "chat"
  }
}
```

### Enviar Arquivo

```bash
curl -X POST http://localhost:3000/api/messages/send-file \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-here" \
  -d '{
    "phone": "5511999999999",
    "filePath": "/path/to/document.pdf",
    "caption": "Aqui está o documento solicitado",
    "isGroup": false,
    "sendAsDocument": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "File message sent successfully",
  "data": {
    "id": "3EB0612D0E32E2296C63",
    "fromMe": true,
    "from": "5511988888888",
    "to": "5511999999999",
    "body": "/path/to/document.pdf",
    "timestamp": 1703001600000,
    "type": "document"
  }
}
```

### Editar Mensagem

```bash
curl -X PUT http://localhost:3000/api/messages/edit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-here" \
  -d '{
    "messageId": "3EB0612D0E32E2296C63",
    "newText": "Mensagem editada!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message edited successfully"
}
```

### Validar Número WhatsApp

```bash
# Via POST
curl -X POST http://localhost:3000/api/whatsapp/validate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-here" \
  -d '{
    "phone": "5511999999999"
  }'

# Via GET
curl "http://localhost:3000/api/whatsapp/validate?phone=5511999999999" \
  -H "X-API-Key: your-secret-key-here"
```

**Response:**
```json
{
  "success": true,
  "message": "Validation completed",
  "data": {
    "phone": "5511999999999",
    "isValid": true
  }
}
```

### Obter Avatar

```bash
# Via GET
curl http://localhost:3000/api/whatsapp/avatar/5511999999999 \
  -H "X-API-Key: your-secret-key-here"

# Via POST
curl -X POST http://localhost:3000/api/whatsapp/avatar \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-here" \
  -d '{
    "phone": "5511999999999"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar URL retrieved successfully",
  "data": {
    "phone": "5511999999999",
    "avatarUrl": "https://pps.whatsapp.net/..."
  }
}
```

### Status da Conexão

```bash
curl http://localhost:3000/api/whatsapp/status \
  -H "X-API-Key: your-secret-key-here"
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp client status",
  "data": {
    "sessionId": "my-instance-1",
    "isReady": true
  }
}
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "clientId": 1,
  "instanceName": "my-instance",
  "uptime": 123456,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 🔐 Autenticação

A API suporta autenticação opcional via API Key:

1. **Configurar** variável de ambiente:
   ```env
   API_KEY=seu-api-key-secreto
   ```

2. **Incluir** header em todas as requisições:
   ```bash
   -H "X-API-Key: seu-api-key-secreto"
   ```

Se `API_KEY` não estiver configurada, a autenticação é desabilitada.

---

## ⚠️ Tratamento de Erros

Todos os erros retornam formato padronizado:

```json
{
  "error": "BadRequest",
  "message": "Invalid phone number format. Must contain at least 10 digits",
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Códigos de Erro Comuns

| Código | Erro | Descrição |
|--------|------|-----------|
| 400 | BadRequest | Requisição inválida ou parâmetros faltando |
| 401 | Unauthorized | API Key inválida ou ausente |
| 404 | NotFound | Endpoint não encontrado |
| 500 | InternalServerError | Erro no servidor |

---

## 📄 Request/Response Examples

### TypeScript/Fetch

```typescript
interface SendMessageRequest {
  phone: string;
  message: string;
  isGroup?: boolean;
}

async function sendMessage(req: SendMessageRequest) {
  const response = await fetch('http://localhost:3000/api/messages/send-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify(req)
  });
  
  return response.json();
}

// Usage
await sendMessage({
  phone: '5511999999999',
  message: 'Hello World!',
  isGroup: false
});
```

### JavaScript/Axios

```javascript
const axios = require('axios');

async function sendMessage(phone, message) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/messages/send-text',
      { phone, message },
      {
        headers: {
          'X-API-Key': 'your-api-key'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
}

sendMessage('5511999999999', 'Hello World!');
```

### Python/Requests

```python
import requests

API_URL = 'http://localhost:3000/api/messages/send-text'
HEADERS = {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
}

data = {
    'phone': '5511999999999',
    'message': 'Hello World!',
    'isGroup': False
}

response = requests.post(API_URL, json=data, headers=HEADERS)
print(response.json())
```

---

## 🏗️ Estrutura de Pastas

```
src/
├── modules/
│   ├── apis/
│   │   ├── express.api.ts         (Este arquivo - vazio antes)
│   │   └── http/
│   │       ├── server.ts           (Factory Express)
│   │       ├── types.ts            (Tipos de requisição/resposta)
│   │       ├── documentation.ts    (OpenAPI spec)
│   │       ├── middleware/
│   │       │   ├── error-handler.middleware.ts
│   │       │   ├── validation.middleware.ts
│   │       │   └── auth.middleware.ts
│   │       └── routes/
│   │           ├── health.routes.ts
│   │           ├── messages.routes.ts
│   │           └── whatsapp.routes.ts
│   ├── data/
│   ├── events/
│   ├── whatsapp/
│   └── ...
├── app.ts                          (Entry point)
└── utils/
```

---

## 🛠️ Desenvolvimento

### TypeScript Compilation

```bash
npx tsc --noEmit
```

### Run with Nodemon (desenvolvimento com auto-reload)

```bash
npm install --save-dev nodemon
npx nodemon --exec ts-node src/app.ts
```

---

## 📝 Notas Importantes

1. **Números de Telefone**: Sempre usar formato internacional com código do país (ex: 5511999999999)
2. **Limite de Mensagem**: Máximo 4096 caracteres por mensagem
3. **Limite de Arquivo**: Máximo 10MB por arquivo
4. **Rate Limiting**: Considere implementar rate limiting em produção
5. **Segurança**: Use variáveis de ambiente para credenciais sensíveis

---

## 🚨 Troubleshooting

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Erro de conexão MySQL

- Verifique credenciais em `.env`
- Confirme se MySQL está rodando
- Verifique firewall

### Erro ao enviar mensagem

- Valide número do telefone (formato internacional)
- Confirme se cliente WhatsApp está conectado (`/api/whatsapp/status`)
- Verifique logs da aplicação

---

## 📚 Referências

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Express.js Guide](https://expressjs.com/)
- [OpenAPI Specification](https://swagger.io/specification/)


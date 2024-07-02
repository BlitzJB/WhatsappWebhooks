import pgk from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pgk;
import fs from 'fs/promises';
import express from 'express';
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
    },
    authStrategy: new LocalAuth({
        dataPath: join(__dirname, '.wwebjs_auth'),
    }),
});

client.on('qr', (qr) => {
    console.log("[WHATSAPP CLIENT] Generating QR Code");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('[WHATSAPP CLIENT] Client ready');
});

client.on("auth_failure", () => {
    console.log("[WHATSAPP CLIENT] Authentication failure");
});

client.on('message', msg => {
    if (msg.body === '!status') {
        msg.reply('alive');
    }
});

async function saveAllChatIds(fname) {
    try {
        console.log("[WHATSAPP CLIENT] Fetching chatIds");
        const chats = await client.getChats();
        const chatIds = chats.map(chat => ({
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            contactId: chat.contactId
        }));
        await fs.writeFile(fname, JSON.stringify(chatIds, null, 2));
        console.log("[WHATSAPP CLIENT] chatIds written to", fname);
    } catch (err) {
        console.error("[WHATSAPP CLIENT] Error saving chat IDs:", err);
    }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for webhook authentication
const authenticateWebhook = async (req, res, next) => {
    const { webhookId } = req.params;
    const { authToken } = req.body;

    try {
        const webhooksData = await fs.readFile('webhooks.json', 'utf-8');
        const webhooks = JSON.parse(webhooksData);
        const webhook = webhooks.find(w => w.id === webhookId);

        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        if (authToken !== webhook.authToken) {
            return res.status(401).json({ error: 'Invalid authToken' });
        }

        req.webhook = webhook;
        next();
    } catch (error) {
        console.error('Error authenticating webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

app.post('/webhook/:webhookId', authenticateWebhook, async (req, res) => {
    const { message } = req.body;
    const { chatId } = req.webhook;

    try {
        const chat = await client.getChatById(chatId);
        await chat.sendMessage(message);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/id/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;
    try {
        const numberId = await client.getNumberId(phoneNumber);
        if (numberId) {
            res.json({ id: numberId._serialized });
        } else {
            res.status(404).json({ error: 'Phone number not found' });
        }
    } catch (error) {
        console.error('Error getting ID by phone number:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/group/:groupName', async (req, res) => {
    const { groupName } = req.params;
    try {
        const chats = await client.getChats();
        const group = chats.find(chat => chat.isGroup && chat.name === groupName);
        if (group) {
            res.json({ id: group.id._serialized });
        } else {
            res.status(404).json({ error: 'Group not found' });
        }
    } catch (error) {
        console.error('Error getting group ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/send', async (req, res) => {
    const { id, message, attachmentUrl, attachmentName } = req.body;
    try {
        const chat = await client.getChatById(id);
        if (attachmentUrl) {
            const response = await axios.get(attachmentUrl, { responseType: 'arraybuffer' });
            const media = new MessageMedia(
                response.headers['content-type'],
                response.data.toString('base64'),
                attachmentName ?? 'attachment'
            );
            await chat.sendMessage(message, { media });
        } else {
            await chat.sendMessage(message);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`[EXPRESS] Server running on port ${PORT}`);
});

console.log("[WHATSAPP CLIENT] Initializing client");
client.initialize();
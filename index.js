import wwebjs from 'whatsapp-web.js';
import fs from 'fs';
import express from 'express';
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = wwebjs;

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
    },
    authStrategy: new LocalAuth({
        dataPath: './',
    }),
});

client.on('qr', (qr) => {
    console.log("[WHATSAPP CLIENT] Generating QR Code")
    qrcode.generate(qr);
});

client.on('ready', () => {
    console.log('[WHATSAPP CLIENT] Client ready');
    saveAllChatIds('./chatIds.json')
});

client.on('message', msg => {
    if (msg.body == '!status') {
        msg.reply('alive');
    }
});

function saveAllChatIds(fname) {
    console.log("[WHATSAPP CLIENT] Fetching chatIds")
    const groups = client.getChats().then((chats) => {
        const chatIds = chats.map(chat => ({...chat.id, name: chat.name, isGroup: chat.isGroup, contactId: chat.contactId}));
        fs.writeFileSync(fname, JSON.stringify(chatIds));
        console.log("[WHATSAPP CLIENT] chatIds written to ", fname)
    })
}


const webhooks = JSON.parse(fs.readFileSync('webhooks.json'));

function sendMessage(req, res) {
    const { webhookId } = req.params;
    const { message, authToken } = req.body;
    const webhook = webhooks.find(webhook => webhook.id === webhookId);
    if (!webhook) {
        console.error('Webhook not found');
        res.status(404).json({ error: 'Webhook not found' });
        return;
    }
    if (authToken !== webhook.authToken) {
        console.error('Invalid authToken');
        res.status(401).json({ error: 'Invalid authToken' });
        return;
    }
    client.getChatById(webhook.chatId).then(chat => {
        chat.sendMessage(message);
        res.status(200).json({ success: true });
    });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhook/:webhookId', (req, res) => {
    sendMessage(req, res)
})

app.listen(3000, () => {
    console.log('[EXPRESS] Server running on port 3000');
})

console.log("[WHATSAPP CLIENT] Initializing client")
client.initialize();

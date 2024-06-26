
<p align="center">
  <img width="200" src="https://github.com/BlitzJB/WhatsappWebhooks/assets/88381529/5335a7a1-b299-4630-923b-abc81ae5298e" alt="Banner Image" />
</p>
WhatsappWebhooks is a selfhostable webhook server for whatsapp. Bring your own account, Authenticate like how you'd link any device, and configure webhooks for any whatsapp chat or group chat you'd like!

# Setup
1. Clone this repo
    ```bash
    git clone https://github.com/BlitzJB/WhatsappWebhooks.git
    ```

2. Install dependencies
    ```bash
    cd WhatsappWebhooks
    npm install
    ```

# Running
1. Define `webhooks.json` as shown in `webhooks.example.json`. To find the `chatId` of the chat/group you'd like to configure your webhook for, find `chatIds.json` generated after the initial run, and get the `_serialized` id value of the corresponding chat.

2. You will have to authenticate your whatsapp on the first run. Scan the QR code that appears on the terminal.

3. Run with `node index.js`

4. Webhooks will only become operational when both the below logs have appeared:
    ```
    [EXPRESS] Server running on port 3000
    [WHATSAPP CLIENT] Client ready
    ```

5. Now the webhook can be queried as follows
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"message": "this is a webhook test", "authToken": "secret token"}' http://localhost:3000/webhook/webhook1
    ```
    ```python
    import requests

    data = { "message": "this is a webhook test" , "authToken": "secret token"}
    requests.post("http://localhost:3000/webhook/webhook1", json=data)
    ```

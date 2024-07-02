import requests


def test():
    url = 'http://localhost:3005/webhook/webhook1'
    payload = {
        "message": "This is an automated message triggered by BlitzDnD.WhatsappWehhooks@local in CHENNAI region. Please ignore this message.",
        "authToken": "secret token here"
    }
    response = requests.post(url, json=payload)
    print(response.text)

def testSend():
    url = 'http://localhost:3005/send'
    payload = {
        "id": "918838814070@c.us",
        "message": "We are glad to see you purchase for *Statesman Bespoke Suits*. \n\nWe will be in touch with you soon. Thank you for your purchase, please find the invoice attached. \n\nHave a great day!",
        "attachmentUrl": "https://invoice.blitzdnd.com/invoices/st_24_25_s1001.pdf",
        "attachmentName": "invoice.pdf",
    }
    response = requests.post(url, json=payload)
    print(response.text)


if __name__ == '__main__':
    test()
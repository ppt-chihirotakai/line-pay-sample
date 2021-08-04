'use strict'

const line = require('@line/bot-sdk')
const express = require('express')
const LinePay = require('./linePay')
const payment = require('./payment')
require('dotenv').config()

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
line.middleware(config);

const app = express();
app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});

// ①購入意思確認
async function handleEvent(event) {
    switch(event.type) {
        case 'postback':
            handlePostbackEvent(event)
            return
        default:
            break;
    }

    return client.replyMessage(event.replyToken, {
        type: 'template',
        altText: '商品明細を確認し、決済をしてください。',
        template: {
            type: 'confirm',
            text: '商品明細を確認し、決済をしてください。',
            actions: [
                { type: 'postback', label: '確認', data: 'yes'},
                { type: 'postback', label: '確認しない', data: 'no'}
            ]
        }
    })
}

// ②決済予約と決済URLの送信
const handlePostbackEvent = async (event) => {
    switch(event.postback.data) {
        case 'yes':
            const linePay = new LinePay()
            const result = await linePay.request(payment)
            console.log(result)
            
            return client.replyMessage(event.replyToken,{
                type: 'template',
                altText: 'こちらから決済を進めてください。',
                template: {
                    type: 'buttons',
                    text: 'こちらから決済を進めてください。',
                    actions: [
                        { type: 'uri', label: 'LINE Payで決済', uri: result.info.paymentUrl.web },
                    ]
                }
            })


        case 'no':
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'またのご利用お待ちしております'
            })
    }
}

const fetch = require('node-fetch')
require('dotenv').config()
const uuid = require('uuid')
const crypto = require('crypto')
const jsonBigInt = require('json-bigint')({ storeAsString: true })


class linePay {
    /**
     * @param {string} path 
     * @param {string} body 
     * @returns LinepayHeader
     */
     async _headers(path, body = '') {
        const channelId = process.env.LINE_PAY_CHANNEL_ID
        const channelSecret = process.env.LINE_PAY_CHANNEL_SECRETKEY
        if(channelId === undefined || channelSecret === undefined) {
            throw new Error('line-pay secret is not found.')
        }

        const nonce = uuid.v4()
        const message = channelSecret + path + body + nonce
        const encrypt = crypto
            .createHmac('sha256', channelSecret)
            .update(message)
        const signature = encrypt.digest('base64')
        return {
            'Content-Type': 'application/json',
            'X-LINE-ChannelId': channelId,
            'X-LINE-Authorization-Nonce': nonce,
            'X-LINE-Authorization': signature,
        }
    }
    /**
     * 
     * @param {string} path 
     * @param {object} payload 
     * @returns resJson
     */
    async _post(path, payload) {
        const body = JSON.stringify(payload)
        const headers = await this._headers(path, body)
        const url = process.env.LINE_PAY_END_POINT + path
        const res = await fetch(url, { method: 'POST', body, headers })
        const resText = await res.text()
        console.log(resText)
        const resJson = jsonBigInt.parse(resText) // JSON.parseでは桁数的に丸められる
        return resJson
    }

    async request(payment) {
        console.log('linePayクラス実行')
        const products = payment.items.map((item) => {
            return {
                name: item.item_name,
                price: item.tax_included_price,
                quantity: item.quantity,
                originalPrice: item.raw_price,
                imageUrl: item.image_url,
            }
        })
        const packages = [
            {
                id: payment.store_code,
                name: payment.store_name,
                amount: payment.amount,
                products,
            },
        ]
        const options = {
            amount: payment.amount,
            currency: 'JPY',
            orderId: payment.payment_id,
            packages,
            options: { payment: { capture: true } },
            redirectUrls: {
                confirmUrl: `https://liff.line.me/1656045804-jxZG6Q0d`, // confirm画面へリダイレクト
                confirmUrlType: 'CLIENT',
                cancelUrl: `https://liff.line.me/1656045804-jxZG6Q0d`, // cancel画面へリダイレクト
            }
        }
        
        const result = await this._post('/v3/payments/request', options)
        if(!result.info || result.returnCode !== '0000') {
            console.log(result)
        }
        return result
    }

    async confirm(transactionId, amount) {
        const options = {
            amount: amount,
            currency: 'JPY',
        }
        const result = await this._post(
            `/v3/payments/${transactionId}/confirm`,
            options
        )
        return result
    }

    async refund(transactionId, amount) {
        const options = {
            refundAmount: amount,
        }
        const result = await this._post(
            `/v3/payments/${transactionId}/refund`,
            options
        )
        return result
    }
    
    async void(transactionId) {
        // confirmed only
        const result = await this._post(
            `/v3/payments/authorizations/${transactionId}/void`
        )
        return result
    }
}

module.exports = linePay
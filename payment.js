const items = [
    {
        image_url: 'https://picsum.photos/200',
        item_id: 'item_1ifetpyzm1',
        item_name: 'テスト アイテム',
        tax_included_price: 330,
        raw_price: 300,
        quantity: 1
    }
]

const payment = {
    payment_id: 'abc123',
    amount: 330,
    items,
    store_code: 'abc123',
    store_name: 'abc123'
}

module.exports = payment
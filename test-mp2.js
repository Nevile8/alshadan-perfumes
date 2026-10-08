const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: '',
  options: { timeout: 10000 } 
});

const preference = new Preference(client);

async function test() {
  try {
    const prefResult = await preference.create({
      body: {
        items: [{
          id: 'TEST_ITEM',
          title: 'Test Item',
          quantity: 1,
          unit_price: 5000,
          currency_id: 'CLP',
        }],
        back_urls: {
          success: 'http://localhost:3000/checkout/status',
          pending: 'http://localhost:3000/checkout/status',
          failure: 'http://localhost:3000/checkout/status',
        },
        auto_return: 'approved'
      }
    });
    console.log("SUCCESS", prefResult.id);
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}
test();
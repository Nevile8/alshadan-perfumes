const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-7010461876402778-092212-32b0c34e88e83344686973e7fc92a6c8-1121873155',
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
        shipments: {
          cost: 3000,
          mode: 'not_specified',
        },
        external_reference: 'test-uuid-1234',
        back_urls: {
          success: 'http://localhost:3000/checkout/status',
          pending: 'http://localhost:3000/checkout/status',
          failure: 'http://localhost:3000/checkout/status',
        },
        auto_return: 'approved',
        payer: {
          name: 'Juan Perez',
          email: 'test_user_123@testuser.com', // Must be valid format
        },
      }
    });
    console.log("SUCCESS:", prefResult.init_point);
  } catch (err) {
    console.error("FAILED:", err.message);
    if (err.cause) console.error("CAUSE:", err.cause);
    if (err.response) console.error("RESPONSE:", err.response);
  }
}
test();
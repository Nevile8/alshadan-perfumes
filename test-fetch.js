async function test() {
  const token = '';
  const url = 'https://api.mercadopago.com/checkout/preferences';
  
  const payload = {
    items: [
      {
        title: 'Test',
        quantity: 1,
        unit_price: 1000,
        currency_id: 'CLP'
      }
    ],
    back_urls: {
      success: 'http://localhost:3000/checkout/status',
      pending: 'http://localhost:3000/checkout/status',
      failure: 'http://localhost:3000/checkout/status'
    },
    auto_return: 'approved'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer 
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
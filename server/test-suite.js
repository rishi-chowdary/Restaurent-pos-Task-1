async function runTests() {
  const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('\n--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.success === true, 'Health check returns 200');

  console.log('\n--- 2. Testing Authentication ---');
  // Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@restaurant.com', password: 'admin123' }),
  });
  const adminLogin = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && adminLogin.data.user.role === 'Admin', 'Admin login succeeds');
  const adminToken = adminLogin.data.token;

  // Staff login
  const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@restaurant.com', password: 'staff123' }),
  });
  const staffLogin = await staffLoginRes.json();
  assert(staffLoginRes.status === 200 && staffLogin.data.user.role === 'Staff', 'Staff login succeeds');
  const staffToken = staffLogin.data.token;

  // Invalid credentials
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@restaurant.com', password: 'wrongpassword' }),
  });
  assert(badLoginRes.status === 401, 'Bad credentials rejected with 401');

  // Verify /auth/me
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.data.email === 'staff@restaurant.com', 'Get me returns authenticated user');

  console.log('\n--- 3. Testing Role-Guard on Admin Routes ---');
  const staffReportRes = await fetch(`${BASE_URL}/reports/daily-sales`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  assert(staffReportRes.status === 403, 'Staff is blocked from Admin reports with 403');

  const adminReportRes = await fetch(`${BASE_URL}/reports/daily-sales`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminReportRes.status === 200, 'Admin can access reports with 200');

  console.log('\n--- 4. Testing Indian Menu Items & INR Currency ---');
  const menuRes = await fetch(`${BASE_URL}/menu`);
  const menu = await menuRes.json();
  assert(menu.data.length >= 10, 'Indian menu items retrieved');
  const biryani = menu.data.find((m) => m.name.includes('Biryani'));
  const curry = menu.data.find((m) => m.name.includes('Makhani'));
  assert(biryani && curry, `Found authentic Indian dishes: ${biryani?.name} and ${curry?.name}`);

  console.log('\n--- 5. Testing Order Creation & Server Billing Engine in INR ---');
  // Attempt tampering: send client-invented total of ₹0.01
  const createOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      type: 'dine-in',
      tableNumber: 'Table T3',
      items: [
        { menuItem: biryani._id, quantity: 2 }, // e.g. 320 * 2 = 640
        { menuItem: curry._id, quantity: 1 },   // e.g. 330 * 1 = 330
      ],
      clientTotal: 0.01, // Client tampering attempt
      discountType: 'percent',
      discountValue: 10, // 10% discount
    }),
  });
  const orderData = await createOrderRes.json();
  assert(createOrderRes.status === 201, 'Order created with 201');
  const order = orderData.data;

  // Expected math:
  // biryani (320 * 2) + curry (330 * 1) = 970 subtotal
  // 10% discount = 97.00
  // taxable = 873.00
  // 5% tax = 43.65
  // total = 916.65
  const expectedSubtotal = biryani.price * 2 + curry.price;
  const expectedDisc = Math.round(expectedSubtotal * 0.1 * 100) / 100;
  const expectedTax = Math.round((expectedSubtotal - expectedDisc) * 0.05 * 100) / 100;
  const expectedTotal = Math.round((expectedSubtotal - expectedDisc + expectedTax) * 100) / 100;

  assert(order.orderNumber.startsWith('ORD-'), `Atomic order number generated: ${order.orderNumber}`);
  assert(order.subtotal === expectedSubtotal, `Server computed correct subtotal: ₹${order.subtotal}`);
  assert(order.discountAmount === expectedDisc, `Server computed discount: ₹${order.discountAmount}`);
  assert(order.taxAmount === expectedTax, `Server computed tax: ₹${order.taxAmount}`);
  assert(order.total === expectedTotal, `Server computed total: ₹${order.total} (ignored client tampering)`);
  assert(order.status === 'Pending', 'Initial status is Pending');
  assert(order.paymentStatus === 'Unpaid', 'Initial paymentStatus is Unpaid');

  console.log('\n--- 6. Testing Unavailable / Inactive Menu Item Rejection ---');
  // Deactivate an item using Admin token
  await fetch(`${BASE_URL}/menu/${biryani._id}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const inactiveOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      type: 'takeaway',
      items: [{ menuItem: biryani._id, quantity: 1 }],
    }),
  });
  assert(inactiveOrderRes.status === 409, 'Ordering inactive item rejected with 409 Conflict');

  // Reactivate item for subsequent tests
  await fetch(`${BASE_URL}/menu/${biryani._id}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log('\n--- 7. Testing Updating Items on Pending Order ---');
  const updateItemsRes = await fetch(`${BASE_URL}/orders/${order._id}/items`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      items: [{ menuItem: curry._id, quantity: 2 }],
      discountType: 'flat',
      discountValue: 50,
    }),
  });
  const updatedItemsData = await updateItemsRes.json();
  assert(updateItemsRes.status === 200, 'Pending order items updated with 200');
  const activeOrder = updatedItemsData.data;

  console.log('\n--- 8. Testing Status Transitions (Strictly Forward) ---');
  // Pending -> Preparing: valid
  const toPrepRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'Preparing' }),
  });
  assert(toPrepRes.status === 200, 'Transition Pending -> Preparing succeeds');

  // Preparing -> Completed (skipping Ready): INVALID
  const skipReadyRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'Completed' }),
  });
  assert(skipReadyRes.status === 409, 'Skipping forward transition (Preparing -> Completed) rejected with 409');

  // Preparing -> Ready: valid
  const toReadyRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'Ready' }),
  });
  assert(toReadyRes.status === 200, 'Transition Preparing -> Ready succeeds');

  // Ready -> Completed without payment: INVALID (Business Rule)
  const completeUnpaidRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'Completed' }),
  });
  assert(completeUnpaidRes.status === 409, 'Completing unpaid order rejected with 409 (Payment required)');

  console.log('\n--- 9. Testing Payment Processing ---');
  // Incorrect amount: rejected
  const badPayRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      method: 'Cash',
      amount: 100.0,
    }),
  });
  assert(badPayRes.status === 422, 'Payment with incorrect amount rejected with 422');

  // Correct payment in INR
  const goodPayRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      method: 'UPI',
      amount: activeOrder.total,
      reference: 'UPI-IND-892019482910',
    }),
  });
  const paidData = await goodPayRes.json();
  assert(goodPayRes.status === 200 && paidData.data.paymentStatus === 'Paid', `Correct payment of ₹${activeOrder.total} accepted and sets Paid`);

  // Second payment attempt: rejected
  const doublePayRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      method: 'Card',
      amount: activeOrder.total,
    }),
  });
  assert(doublePayRes.status === 409, 'Paying an already paid order rejected with 409 ALREADY_PAID');

  // Ready -> Completed after payment: valid
  const completePaidRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'Completed' }),
  });
  assert(completePaidRes.status === 200, 'Transition Ready -> Completed succeeds after payment');

  console.log('\n--- 10. Testing Admin Daily Sales Report & Settings ---');
  const dailyReportRes = await fetch(`${BASE_URL}/reports/daily-sales`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const dailyReport = await dailyReportRes.json();
  assert(dailyReport.data.summary.totalRevenue >= activeOrder.total, `Daily report revenue includes paid order: ₹${dailyReport.data.summary.totalRevenue}`);
  assert(dailyReport.data.paymentBreakdown.UPI.amount >= activeOrder.total, 'UPI payment recorded in channel breakdown');
  assert(dailyReport.data.staffBreakdown.length > 0, 'Staff breakdown reflects order activity');

  // Update Settings
  const updateSettingsRes = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ taxRate: 5.0 }),
  });
  const settingsData = await updateSettingsRes.json();
  assert(updateSettingsRes.status === 200 && settingsData.data.taxRate === 5.0, 'Admin verified GST rate 5%');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
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

  console.log('\n--- 4. Testing Menu Items ---');
  const menuRes = await fetch(`${BASE_URL}/menu`);
  const menu = await menuRes.json();
  assert(menu.data.length >= 10, 'Menu items retrieved');
  const burger = menu.data.find((m) => m.name.includes('Burger'));
  const pizza = menu.data.find((m) => m.name.includes('Pizza'));
  assert(burger && pizza, 'Burger and Pizza exist in seeded menu');

  console.log('\n--- 5. Testing Order Creation & Server Billing Engine ---');
  // Attempt tampering: send client-invented total of $0.01
  const createOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      type: 'dine-in',
      tableNumber: 'Table 5',
      items: [
        { menuItem: burger._id, quantity: 2 },
        { menuItem: pizza._id, quantity: 1 },
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
  // burger = 14.99 * 2 = 29.98
  // pizza = 13.50 * 1 = 13.50
  // subtotal = 43.48
  // 10% discount = 4.35
  // taxable = 39.13
  // 5% tax = 1.96
  // total = 41.09
  assert(order.orderNumber.startsWith('ORD-'), `Atomic order number generated: ${order.orderNumber}`);
  assert(order.subtotal === 43.48, `Server computed correct subtotal: $${order.subtotal} (expected 43.48)`);
  assert(order.discountAmount === 4.35, `Server computed discount: $${order.discountAmount} (expected 4.35)`);
  assert(order.taxAmount === 1.96, `Server computed tax: $${order.taxAmount} (expected 1.96)`);
  assert(order.total === 41.09, `Server computed total: $${order.total} (expected 41.09, ignored client tampering)`);
  assert(order.status === 'Pending', 'Initial status is Pending');
  assert(order.paymentStatus === 'Unpaid', 'Initial paymentStatus is Unpaid');

  console.log('\n--- 6. Testing Unavailable / Inactive Menu Item Rejection ---');
  // Deactivate an item using Admin token
  await fetch(`${BASE_URL}/menu/${burger._id}/deactivate`, {
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
      items: [{ menuItem: burger._id, quantity: 1 }],
    }),
  });
  assert(inactiveOrderRes.status === 409, 'Ordering inactive item rejected with 409 Conflict');

  // Reactivate item for subsequent tests
  await fetch(`${BASE_URL}/menu/${burger._id}/deactivate`, {
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
      items: [{ menuItem: pizza._id, quantity: 2 }],
      discountType: 'flat',
      discountValue: 5,
    }),
  });
  const updatedItemsData = await updateItemsRes.json();
  assert(updateItemsRes.status === 200, 'Pending order items updated with 200');
  // pizza = 13.50 * 2 = 27.00
  // discount = 5.00
  // taxable = 22.00
  // 5% tax = 1.10
  // total = 23.10
  assert(updatedItemsData.data.total === 23.1, `Recalculated total is $${updatedItemsData.data.total} (expected 23.1)`);
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
      amount: 10.0, // Order total is 23.10
    }),
  });
  assert(badPayRes.status === 422, 'Payment with incorrect amount rejected with 422');

  // Correct payment
  const goodPayRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      method: 'UPI',
      amount: 23.10,
      reference: 'UPI-TEST-12345678',
    }),
  });
  const paidData = await goodPayRes.json();
  assert(goodPayRes.status === 200 && paidData.data.paymentStatus === 'Paid', 'Correct payment accepted and sets Paid');

  // Second payment attempt: rejected
  const doublePayRes = await fetch(`${BASE_URL}/orders/${activeOrder._id}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      method: 'Card',
      amount: 23.10,
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
  assert(dailyReport.data.summary.totalRevenue >= 23.1, `Daily report revenue includes paid order: $${dailyReport.data.summary.totalRevenue}`);
  assert(dailyReport.data.paymentBreakdown.UPI.amount >= 23.1, 'UPI payment recorded in channel breakdown');
  assert(dailyReport.data.staffBreakdown.length > 0, 'Staff breakdown reflects order activity');

  // Update Settings
  const updateSettingsRes = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ taxRate: 8.5 }),
  });
  const settingsData = await updateSettingsRes.json();
  assert(updateSettingsRes.status === 200 && settingsData.data.taxRate === 8.5, 'Admin updated tax rate to 8.5%');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});

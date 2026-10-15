import { OrderModel } from '../models/order.model';

export async function getDailySalesReport(dateString?: string) {
  let startDate: Date;
  let endDate: Date;

  if (dateString) {
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  const orders = await OrderModel.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: { $ne: 'Cancelled' },
  })
    .populate('createdBy', 'name email role')
    .populate('payment.recordedBy', 'name email role');

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const paidOrders = orders.filter((o) => o.paymentStatus === 'Paid');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const totalTaxCollected = paidOrders.reduce((sum, o) => sum + o.taxAmount, 0);
  const totalDiscountGiven = paidOrders.reduce((sum, o) => sum + o.discountAmount, 0);

  // Breakdown by payment method
  const paymentMethodSummary = {
    Cash: { count: 0, amount: 0 },
    UPI: { count: 0, amount: 0 },
    Card: { count: 0, amount: 0 },
  };

  for (const order of paidOrders) {
    if (order.payment?.method && paymentMethodSummary[order.payment.method]) {
      paymentMethodSummary[order.payment.method].count += 1;
      paymentMethodSummary[order.payment.method].amount += order.payment.amount;
    }
  }

  // Breakdown by staff members
  const staffSummaryMap = new Map<string, { staffId: string; name: string; email: string; orderCount: number; totalSales: number }>();

  for (const order of orders) {
    const staff = order.createdBy as any;
    if (staff && staff._id) {
      const staffId = staff._id.toString();
      const existing = staffSummaryMap.get(staffId) || {
        staffId,
        name: staff.name,
        email: staff.email,
        orderCount: 0,
        totalSales: 0,
      };

      existing.orderCount += 1;
      if (order.paymentStatus === 'Paid') {
        existing.totalSales += order.total;
      }
      staffSummaryMap.set(staffId, existing);
    }
  }

  // Breakdown by popular items
  const itemSummaryMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = itemSummaryMap.get(item.nameSnapshot) || {
        name: item.nameSnapshot,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.lineTotal;
      itemSummaryMap.set(item.nameSnapshot, existing);
    }
  }

  const topItems = Array.from(itemSummaryMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    date: startDate.toISOString().split('T')[0],
    summary: {
      totalOrders,
      completedOrders,
      paidOrdersCount: paidOrders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      averageOrderValue: paidOrders.length > 0 ? Math.round((totalRevenue / paidOrders.length) * 100) / 100 : 0,
    },
    paymentBreakdown: paymentMethodSummary,
    staffBreakdown: Array.from(staffSummaryMap.values()),
    topSellingItems: topItems,
  };
}

const API_BASE = '/api';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface OrderItem {
  menuItem: string | MenuItem;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  type: 'dine-in' | 'takeaway';
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Paid';
  payment?: {
    method: 'Cash' | 'UPI' | 'Card';
    amount: number;
    reference?: string;
    paidAt: string;
    recordedBy?: {
      _id: string;
      name: string;
      email: string;
    };
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface DailyReport {
  date: string;
  summary: {
    totalOrders: number;
    completedOrders: number;
    paidOrdersCount: number;
    totalRevenue: number;
    totalTaxCollected: number;
    totalDiscountGiven: number;
    averageOrderValue: number;
  };
  paymentBreakdown: {
    Cash: { count: 0; amount: 0 };
    UPI: { count: 0; amount: 0 };
    Card: { count: 0; amount: 0 };
  };
  staffBreakdown: Array<{
    staffId: string;
    name: string;
    email: string;
    orderCount: number;
    totalSales: number;
  }>;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('pos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    const error: ApiError = payload.error || {
      code: 'REQUEST_FAILED',
      message: 'An unknown server error occurred',
    };
    throw error;
  }

  return payload.data;
}

// Authentication
export async function loginApi(credentials: { email: string; password: string }) {
  return request<{ token: string; user: { id: string; name: string; email: string; role: 'Admin' | 'Staff' } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(credentials) }
  );
}

export async function getMeApi() {
  return request<{ id: string; name: string; email: string; role: 'Admin' | 'Staff' }>('/auth/me');
}

// Menu
export async function getMenuItemsApi(params?: { q?: string; category?: string; available?: boolean }) {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.category) query.append('category', params.category);
  if (params?.available !== undefined) query.append('available', String(params.available));

  const queryStr = query.toString();
  return request<MenuItem[]>(`/menu${queryStr ? `?${queryStr}` : ''}`);
}

export async function createMenuItemApi(data: Partial<MenuItem>) {
  return request<MenuItem>('/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMenuItemApi(id: string, data: Partial<MenuItem>) {
  return request<MenuItem>(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deactivateMenuItemApi(id: string) {
  return request<MenuItem>(`/menu/${id}/deactivate`, {
    method: 'PATCH',
  });
}

// Orders
export async function getOrdersApi(params?: { status?: string; q?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.q) query.append('q', params.q);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const queryStr = query.toString();
  return request<{ orders: Order[]; pagination: { page: number; limit: number; totalCount: number; totalPages: number } }>(
    `/orders${queryStr ? `?${queryStr}` : ''}`
  );
}

export async function getOrderByIdApi(id: string) {
  return request<Order>(`/orders/${id}`);
}

export async function createOrderApi(data: {
  type: 'dine-in' | 'takeaway';
  tableNumber?: string;
  items: Array<{ menuItem: string; quantity: number }>;
  discountType?: 'percent' | 'flat';
  discountValue?: number;
}) {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrderItemsApi(
  id: string,
  data: {
    items: Array<{ menuItem: string; quantity: number }>;
    discountType?: 'percent' | 'flat';
    discountValue?: number;
  }
) {
  return request<Order>(`/orders/${id}/items`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateOrderStatusApi(id: string, status: string) {
  return request<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function recordPaymentApi(
  id: string,
  data: {
    method: 'Cash' | 'UPI' | 'Card';
    amount: number;
    reference?: string;
  }
) {
  return request<Order>(`/orders/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function cancelOrderApi(id: string) {
  return request<Order>(`/orders/${id}/cancel`, {
    method: 'PATCH',
  });
}

// Reports & Settings
export async function getDailySalesReportApi(date?: string) {
  const query = date ? `?date=${date}` : '';
  return request<DailyReport>(`/reports/daily-sales${query}`);
}

export async function getSettingsApi() {
  return request<{ taxRate: number }>('/settings');
}

export async function updateSettingsApi(taxRate: number) {
  return request<{ taxRate: number }>('/settings', {
    method: 'PUT',
    body: JSON.stringify({ taxRate }),
  });
}

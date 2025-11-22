
export interface RawSalesData {
  businessUnit: string; // 事业部
  department: string; // 部门
  salesperson: string; // 业务员
  date: string; // 发货日期 (YYYY-MM-DD)
  customerName: string; // 客户名称
  companyName: string; // 总公司名称
  sku: string; // 单品编码
  productName: string; // 单品名称
  quantity: number; // 发货数量
  amount: number; // 发货含税金额本币（元）
}

export interface ProcessedSalesData extends RawSalesData {
  category: string; // 品类 (Derived)
  subCategory: string; // 小分类 (Derived)
  year: number;
  month: number;
}

export interface CategoryRule {
  keyword: string;
  category: string;
  subCategory: string;
}

export interface FilterState {
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  businessUnit: string;
  department: string;
  salesperson: string;
  category: string;
  subCategory: string;
  customerName: string;
  productName: string;
}

export interface UserSession {
  role: 'admin' | 'department';
  username: string;
  departmentFilter?: string; // If set, strictly filters data
}

export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  [key: string]: any;
}

export interface TrendDataPoint {
  month: string; // "01", "02"...
  [year: string]: number | string; // Dynamic keys for years: "2023": 1000
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalQuantity: number;
  totalOrders: number;
  topCategory: string;
}

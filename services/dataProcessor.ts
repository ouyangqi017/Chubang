
import { RawSalesData, ProcessedSalesData, ChartDataPoint, TrendDataPoint, FilterState } from '../types';
import { CATEGORY_RULES, DEFAULT_CATEGORY, DEFAULT_SUB_CATEGORY } from '../constants';

export const mapProductCategory = (productName: string): { category: string; subCategory: string } => {
  for (const rule of CATEGORY_RULES) {
    if (productName.includes(rule.keyword)) {
      return { category: rule.category, subCategory: rule.subCategory };
    }
  }
  return { category: DEFAULT_CATEGORY, subCategory: DEFAULT_SUB_CATEGORY };
};

export const processData = (rawData: RawSalesData[]): ProcessedSalesData[] => {
  return rawData.map((item) => {
    const { category, subCategory } = mapProductCategory(item.productName);
    const dateObj = new Date(item.date);
    return {
      ...item,
      category,
      subCategory,
      year: dateObj.getFullYear(),
      month: dateObj.getMonth() + 1,
    };
  });
};

export const getAvailableYears = (data: ProcessedSalesData[]): number[] => {
  const years = new Set(data.map(d => d.year));
  return Array.from(years).sort((a, b) => a - b);
};

export const filterData = (data: ProcessedSalesData[], filters: FilterState, deptConstraint?: string): ProcessedSalesData[] => {
  return data.filter(item => {
    // Date Range Logic
    const itemDateVal = item.year * 100 + item.month;
    const startDateVal = parseInt(filters.startYear) * 100 + parseInt(filters.startMonth);
    const endDateVal = parseInt(filters.endYear) * 100 + parseInt(filters.endMonth);
    
    if (itemDateVal < startDateVal || itemDateVal > endDateVal) return false;

    // Constraint (Dept Account)
    if (deptConstraint && item.department !== deptConstraint) return false;

    // Standard Filters
    if (filters.businessUnit && filters.businessUnit !== 'All' && item.businessUnit !== filters.businessUnit) return false;
    if (filters.department && filters.department !== 'All' && item.department !== filters.department) return false;
    if (filters.salesperson && filters.salesperson !== 'All' && item.salesperson !== filters.salesperson) return false;
    if (filters.category && filters.category !== 'All' && item.category !== filters.category) return false;
    if (filters.subCategory && filters.subCategory !== 'All' && item.subCategory !== filters.subCategory) return false;
    
    // Search Filters (Text Includes)
    if (filters.customerName && !item.customerName.includes(filters.customerName)) return false;
    if (filters.productName && !item.productName.includes(filters.productName)) return false;

    return true;
  });
};

export const aggregateByField = (data: ProcessedSalesData[], field: keyof ProcessedSalesData): ChartDataPoint[] => {
  const map = new Map<string, number>();
  let total = 0;
  
  data.forEach(d => {
    const key = String(d[field]);
    const val = d.amount;
    map.set(key, (map.get(key) || 0) + val);
    total += val;
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ 
      name, 
      value,
      percentage: total > 0 ? (value / total) * 100 : 0 
    }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Generates data for Year-Over-Year comparison.
 * Maps Jan-Dec on X-axis, with separate keys for each Year.
 * NO LIMIT on years (shows all available years).
 */
export const getTrendData = (data: ProcessedSalesData[]): { chartData: TrendDataPoint[], years: string[] } => {
  const yearsFound = new Set<number>();
  const monthlyMap: Record<string, Record<string, number>> = {};

  // Init structure for 1-12 months
  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString().padStart(2, '0');
    monthlyMap[mStr] = {};
  }

  data.forEach(d => {
    const mStr = d.month.toString().padStart(2, '0');
    const yStr = d.year.toString();
    yearsFound.add(d.year);
    
    if (!monthlyMap[mStr][yStr]) monthlyMap[mStr][yStr] = 0;
    monthlyMap[mStr][yStr] += d.amount;
  });

  // Sort years (No limit)
  const sortedYears = Array.from(yearsFound).sort((a, b) => a - b).map(String);

  const chartData: TrendDataPoint[] = Object.keys(monthlyMap).sort().map(month => {
    const point: TrendDataPoint = { month: `${month}月` };
    sortedYears.forEach(year => {
      point[year] = monthlyMap[month][year] || 0; 
    });
    return point;
  });

  return { chartData, years: sortedYears };
};

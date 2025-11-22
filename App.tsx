import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Download, Filter, Search, User, LogOut, Briefcase, Layers, Package, Users, ChevronDown, ChevronLeft, ChevronRight, RefreshCcw, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { RawSalesData, ProcessedSalesData, FilterState, UserSession, ChartDataPoint } from './types';
import { generateMockData } from './constants';
import { processData, getAvailableYears, filterData, aggregateByField, getTrendData } from './services/dataProcessor';

// --- UTILS ---
const formatWan = (val: number) => {
  return `¥${(val / 10000).toFixed(2)}万`;
};

// --- UI COMPONENTS ---

const Card: React.FC<{ 
  title?: string; 
  children: React.ReactNode; 
  className?: string;
  fullHeight?: boolean;
}> = ({ title, children, className = '', fullHeight = false }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 p-5 flex flex-col transition-all duration-300 hover:shadow-md ${className} ${fullHeight ? 'h-full' : ''}`}>
    {title && (
      <h3 className="text-slate-700 font-bold text-base mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded-full block"></span>
        {title}
      </h3>
    )}
    <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
      {children}
    </div>
  </div>
);

const SearchableSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ options, value, onChange, placeholder = '请选择...', icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`flex items-center gap-2 bg-white px-3 py-2 rounded-xl border transition-all cursor-pointer ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className={`text-sm truncate flex-1 ${value && value !== 'All' ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
          {value === 'All' ? '全部' : (value || placeholder)}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-50">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg">
              <Search size={12} className="text-slate-400" />
              <input 
                type="text" 
                className="bg-transparent w-full text-xs outline-none text-slate-700"
                placeholder="搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            <div 
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === 'All' ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              onClick={() => { onChange('All'); setIsOpen(false); }}
            >
              全部
            </div>
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt} 
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === opt ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
              >
                {opt}
              </div>
            )) : (
              <div className="px-4 py-2 text-xs text-slate-400">无结果</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PaginatedRankingList: React.FC<{ 
  data: ChartDataPoint[]; 
  colorClass?: string;
  titleCols?: { rank: string; name: string; value: string; percent: string } 
}> = ({ 
  data, 
  colorClass = 'bg-blue-500',
  titleCols = { rank: '排名', name: '名称', value: '销售额', percent: '占比' }
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.ceil(data.length / pageSize);
  
  const currentData = data.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when data changes
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase bg-slate-50/50 rounded-lg px-3 py-2 mb-1">
        <div className="col-span-2 text-center">{titleCols.rank}</div>
        <div className="col-span-5">{titleCols.name}</div>
        <div className="col-span-3 text-right">{titleCols.value}</div>
        <div className="col-span-2 text-right">{titleCols.percent}</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {currentData.length > 0 ? (
          currentData.map((item, idx) => {
            const rank = (page - 1) * pageSize + idx + 1;
            return (
              <div key={item.name} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-50 last:border-0 text-sm hover:bg-slate-50 transition-colors px-2 rounded-lg">
                <div className="col-span-2 flex justify-center">
                   <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                    {rank}
                   </span>
                </div>
                <div className="col-span-5 truncate font-medium text-slate-700" title={item.name}>
                  {item.name}
                </div>
                <div className="col-span-3 text-right font-mono text-slate-600">
                  {formatWan(item.value)}
                </div>
                <div className="col-span-2 text-right text-xs text-slate-500">
                   <div className="flex flex-col items-end gap-0.5">
                      <span>{item.percentage?.toFixed(1)}%</span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${item.percentage}%` }}></div>
                      </div>
                   </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-20 text-slate-400 text-sm">无数据</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
           <button 
             onClick={() => setPage(p => Math.max(1, p - 1))}
             disabled={page === 1}
             className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
           >
             <ChevronLeft size={16} />
           </button>
           <span className="text-xs text-slate-400 font-medium">
             第 {page} / {totalPages} 页
           </span>
           <button 
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
             className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
           >
             <ChevronRight size={16} />
           </button>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6'];

const App: React.FC = () => {
  // Session
  const [user, setUser] = useState<UserSession | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Data
  // rawData is not strictly used for display, but kept in state for data consistency
  const [, setRawData] = useState<RawSalesData[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedSalesData[]>([]);
  const [isCustomData, setIsCustomData] = useState(false);
  
  // Filters
  const [years, setYears] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    startYear: '',
    startMonth: '1',
    endYear: '',
    endMonth: '12',
    businessUnit: 'All',
    department: 'All',
    salesperson: 'All',
    category: 'All',
    subCategory: 'All',
    customerName: '',
    productName: ''
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load mock data initially
    loadMockData();
  }, []);

  const loadMockData = () => {
    const data = generateMockData(1000);
    updateData(data);
    setIsCustomData(false);
  };

  const updateData = (data: RawSalesData[]) => {
    const processed = processData(data);
    setRawData(data);
    setProcessedData(processed);
    
    const availYears = getAvailableYears(processed);
    setYears(availYears);
    
    if (availYears.length > 0) {
      const latestYear = availYears[availYears.length - 1].toString();
      setFilters(prev => ({
        ...prev,
        startYear: latestYear,
        endYear: latestYear,
        startMonth: '1',
        endMonth: '12',
        businessUnit: 'All',
        department: 'All',
        salesperson: 'All',
        category: 'All',
        subCategory: 'All',
        customerName: '',
        productName: ''
      }));
    }
  };

  const processImportedData = (rawData: any[]) => {
    try {
      const mappedData: RawSalesData[] = rawData.map((item: any) => {
        // 解析日期：支持 String, MongoDB $date, Excel Date Object, Excel Serial Number (如果未被库处理)
        let dateStr = '';
        
        if (item['发货日期'] instanceof Date) {
          // Excel (cellDates: true)
          dateStr = item['发货日期'].toISOString().split('T')[0];
        } else if (item['date'] instanceof Date) {
           dateStr = item['date'].toISOString().split('T')[0];
        } else if (typeof item['发货日期'] === 'string') {
          // String
          dateStr = item['发货日期'];
        } else if (item['发货日期'] && item['发货日期']['$date']) {
          // MongoDB JSON
          dateStr = item['发货日期']['$date'];
        } else if (item['date']) {
          dateStr = String(item['date']);
        }
        
        // Fallback for date parsing
        const finalDate = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];

        return {
          businessUnit: item['事业部'] || item.businessUnit || '',
          department: item['部门'] || item.department || '',
          salesperson: item['业务员'] || item.salesperson || '',
          date: finalDate,
          customerName: item['客户名称'] || item.customerName || '未知客户',
          companyName: item['总公司名称'] || item.companyName || '',
          sku: item['单品编码'] || item.sku || '',
          productName: item['单品名称'] || item.productName || '未知商品',
          quantity: Number(item['发货数量'] || item.quantity || 0),
          amount: Number(item['发货含税金额本币（元）'] || item.amount || 0),
        };
      });

      // 过滤掉无效数据
      const validData = mappedData.filter(d => d.productName && d.date && d.amount !== undefined);

      if (validData.length > 0) {
         updateData(validData);
         setIsCustomData(true);
         alert(`成功导入 ${validData.length} 条数据！`);
      } else {
         alert('导入失败：未能识别有效数据。请检查文件字段名（如：单品名称、发货日期、发货含税金额本币（元））。');
      }
    } catch (error) {
      console.error(error);
      alert('数据解析发生错误，请检查文件格式。');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isJson = file.name.toLowerCase().endsWith('.json');
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) {
            processImportedData(json);
          } else {
            alert('JSON 文件必须包含一个数组。');
          }
        } catch (error) {
          console.error(error);
          alert('解析 JSON 失败。');
        }
      };
      reader.readAsText(file);
    } else if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          // 取第一个 Sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // 转换为 JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processImportedData(jsonData);
        } catch (error) {
           console.error(error);
           alert('解析 Excel 失败，请确保文件未加密且格式正确。');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('不支持的文件格式。请上传 .json, .xlsx 或 .xls 文件。');
    }

    // Reset input
    event.target.value = ''; 
  };

  // --- LOGIN LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'admin') {
      setUser({ role: 'admin', username: '管理员' });
    } else if (loginPass === 'abcd1234') {
      setUser({ role: 'department', username: loginUser, departmentFilter: loginUser });
      setFilters(prev => ({ ...prev, department: loginUser }));
    } else {
      alert('账号或密码错误。请尝试 admin/admin 或 [部门名称]/123');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginUser('');
    setLoginPass('');
    setFilters(prev => ({ ...prev, department: 'All' }));
  };

  // --- COMPUTED DATA ---
  const filteredData = useMemo(() => {
    if (!user) return [];
    return filterData(processedData, filters, user.departmentFilter);
  }, [processedData, filters, user]);

  const { 
    totalAmount, totalQty, 
    trendData, trendYears,
    deptStats, personStats, 
    catStats, subCatStats, 
    custStats, prodStats 
  } = useMemo(() => {
    const totalAmount = filteredData.reduce((s, i) => s + i.amount, 0);
    const totalQty = filteredData.reduce((s, i) => s + i.quantity, 0);

    const { chartData: trendData, years: trendYears } = getTrendData(filteredData);

    return {
      totalAmount,
      totalQty,
      trendData,
      trendYears,
      deptStats: aggregateByField(filteredData, 'department'),
      personStats: aggregateByField(filteredData, 'salesperson'),
      catStats: aggregateByField(filteredData, 'category'),
      subCatStats: aggregateByField(filteredData, 'subCategory'),
      custStats: aggregateByField(filteredData, 'customerName'),
      prodStats: aggregateByField(filteredData, 'productName'),
    };
  }, [filteredData]);

  // Calculate Annual Totals for Tooltip percentage calculation
  const annualTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredData.forEach(d => {
      const y = d.year.toString();
      totals[y] = (totals[y] || 0) + d.amount;
    });
    return totals;
  }, [filteredData]);

  // --- FILTER OPTIONS ---
  const options = useMemo(() => {
    const base = user?.departmentFilter 
      ? processedData.filter(d => d.department === user.departmentFilter)
      : processedData;
    
    return {
      bus: Array.from(new Set(base.map(d => d.businessUnit))).filter(Boolean).sort(),
      depts: Array.from(new Set(base.map(d => d.department))).filter(Boolean).sort(),
      sales: Array.from(new Set(base.map(d => d.salesperson))).filter(Boolean).sort(),
      cats: Array.from(new Set(base.map(d => d.category))).filter(Boolean).sort(),
      subCats: Array.from(new Set(base.map(d => d.subCategory))).filter(Boolean).sort(),
      custs: Array.from(new Set(base.map(d => d.customerName))).filter(Boolean).sort(),
    };
  }, [processedData, user]);

  // --- EXPORT SUMMARY EXCEL (CSV) ---
  const handleExportAggregated = () => {
    if (user?.role !== 'admin') return;

    const BOM = "\uFEFF"; // UTF-8 BOM for Excel
    let csvContent = BOM;

    // Helper to append a section
    const appendSection = (title: string, data: ChartDataPoint[], columns = ["排名", "名称", "销售金额(元)", "占比"]) => {
      csvContent += `${title}\n`;
      csvContent += columns.join(",") + "\n";
      data.forEach((item, index) => {
        csvContent += `${index + 1},"${item.name}",${item.value},"${item.percentage?.toFixed(2)}%"\n`;
      });
      csvContent += "\n\n"; // Empty lines between sections
    };

    // 1. Dept Stats
    appendSection("部门销售占比", deptStats, ["排名", "部门", "销售金额(元)", "占比"]);

    // 2. Salesperson Stats (Exports ALL data, not just visible)
    appendSection("业务员业绩排名", personStats, ["排名", "业务员", "销售金额(元)", "占比"]);

    // 3. Category Stats
    appendSection("品类销售占比", catStats, ["排名", "品类", "销售金额(元)", "占比"]);

    // 4. SubCategory Stats
    appendSection("小分类销售排行", subCatStats, ["排名", "小分类", "销售金额(元)", "占比"]);

    // 5. Customer Stats
    appendSection("客户贡献排名", custStats, ["排名", "客户名称", "销售金额(元)", "占比"]);

    // 6. Product Stats
    appendSection("单品销售排名", prodStats, ["排名", "单品名称", "销售金额(元)", "占比"]);

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `sales_summary_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- RENDER: LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-24 -right-24 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-white/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white mb-4 shadow-lg">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">厨邦发货数据洞察 Pro</h1>
            <p className="text-slate-500 mt-2 text-sm">安全数据可视化门户</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">账号 / 部门</label>
              <input 
                type="text" 
                value={loginUser} 
                onChange={e => setLoginUser(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="输入账号"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">密码</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="输入密码"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-200"
            >
              进入仪表盘
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-400">
            兼容本地 Excel / JSON 数据导入
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 font-sans selection:bg-blue-100">
      {/* Top Nav */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <LayoutDashboard size={20} />
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight">厨邦发货数据洞察</h1>
             <div className="text-xs text-slate-500 flex items-center gap-1">
               <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
               {user.username} 视图
               {isCustomData && <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">自选数据源</span>}
             </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           {user.role === 'admin' && (
             <>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept=".json,.xlsx,.xls" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={16} />
                    导入数据 (Excel/JSON)
                  </label>
                  {isCustomData && (
                    <button
                      onClick={loadMockData}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      title="重置为模拟数据"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  )}
                </div>

                <button 
                  onClick={handleExportAggregated}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Download size={16} />
                  生成分析数据 (Excel)
                </button>
             </>
           )}
           <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
           >
             <LogOut size={16} />
             退出登录
           </button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* KPI Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* LEFT: Total Revenue */}
           <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10"><Users size={100} /></div>
              <p className="text-purple-100 text-sm font-medium mb-1 uppercase tracking-wider">总发货额</p>
              <h2 className="text-4xl font-bold flex items-baseline gap-2">
                {formatWan(totalAmount)}
                <span className="text-lg opacity-70 font-normal">RMB</span>
              </h2>
           </div>

           {/* RIGHT: Total Quantity */}
           <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10"><Package size={100} /></div>
              <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">总件数</p>
              <h2 className="text-4xl font-bold">{totalQty.toLocaleString()}</h2>
           </div>
        </div>

        {/* Advanced Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-fade-in-up relative z-30">
           <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm uppercase tracking-wide">
              <Filter size={16} />
              数据筛选
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {/* Date Range */}
              <div className="col-span-1 md:col-span-2 flex gap-2 items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                 <select value={filters.startYear} onChange={e => setFilters({...filters, startYear: e.target.value})} className="bg-transparent text-sm p-2 outline-none font-medium text-slate-700 cursor-pointer">
                    {years.map(y => <option key={y} value={y}>{y}年</option>)}
                 </select>
                 
                 <select value={filters.startMonth} onChange={e => setFilters({...filters, startMonth: e.target.value})} className="bg-transparent text-sm p-2 outline-none font-medium text-slate-700 cursor-pointer">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
                 </select>
                 <span className="text-slate-300 mx-1">-</span>
                 <select value={filters.endYear} onChange={e => setFilters({...filters, endYear: e.target.value})} className="bg-transparent text-sm p-2 outline-none font-medium text-slate-700 cursor-pointer">
                    {years.map(y => <option key={y} value={y}>{y}年</option>)}
                 </select>
                 
                 <select value={filters.endMonth} onChange={e => setFilters({...filters, endMonth: e.target.value})} className="bg-transparent text-sm p-2 outline-none font-medium text-slate-700 cursor-pointer">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
                 </select>
              </div>

              {user.role === 'admin' && (
                <>
                  <SearchableSelect 
                    placeholder="事业部" 
                    options={options.bus} 
                    value={filters.businessUnit} 
                    onChange={v => setFilters({...filters, businessUnit: v})} 
                    icon={<Layers size={14}/>}
                  />
                  <SearchableSelect 
                    placeholder="部门" 
                    options={options.depts} 
                    value={filters.department} 
                    onChange={v => setFilters({...filters, department: v})} 
                    icon={<Briefcase size={14}/>}
                  />
                </>
              )}

              <SearchableSelect 
                placeholder="业务员" 
                options={options.sales} 
                value={filters.salesperson} 
                onChange={v => setFilters({...filters, salesperson: v})} 
                icon={<User size={14}/>}
              />

              <SearchableSelect 
                placeholder="品类" 
                options={options.cats} 
                value={filters.category} 
                onChange={v => setFilters({...filters, category: v})} 
              />

              <SearchableSelect 
                placeholder="小分类" 
                options={options.subCats} 
                value={filters.subCategory} 
                onChange={v => setFilters({...filters, subCategory: v})} 
              />

               <div className="relative flex items-center">
                  <Search size={14} className="absolute left-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="搜索客户名称..." 
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={filters.customerName}
                    onChange={e => setFilters({...filters, customerName: e.target.value})}
                  />
               </div>
               
               <div className="relative flex items-center">
                  <Search size={14} className="absolute left-3 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="搜索单品名称..." 
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={filters.productName}
                    onChange={e => setFilters({...filters, productName: e.target.value})}
                  />
               </div>
           </div>
        </div>

        {/* Visualizations Layout */}
        
        {/* 1. Trend Chart */}
        <Card title="月度销售趋势 (历年同比)">
          <div className="h-[320px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val/10000}万`} />
                   <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number, name: string) => {
                         const year = name.replace('年', '');
                         const yearTotal = annualTotals[year] || 0;
                         const percent = yearTotal > 0 ? (val / yearTotal * 100).toFixed(1) + '%' : '0%';
                         return [
                            `${formatWan(val)} (占当年 ${percent})`, 
                            name
                         ];
                      }}
                   />
                   <Legend iconType="circle" verticalAlign="top" height={36}/>
                   {trendYears.map((year, idx) => (
                      <Line 
                        key={year} 
                        type="monotone" 
                        dataKey={year} 
                        name={`${year}年`}
                        stroke={COLORS[idx % COLORS.length]} 
                        strokeWidth={3}
                        dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                   ))}
                </LineChart>
             </ResponsiveContainer>
          </div>
        </Card>

        {/* Layout Switching based on Role */}
        {user.role === 'admin' ? (
          <>
            {/* ADMIN ROW 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card title="部门销售占比">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie 
                            data={deptStats} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={60} 
                            outerRadius={90} 
                            paddingAngle={5} 
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                         >
                           {deptStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <RechartsTooltip formatter={(val: number, name: string, props: any) => [
                            `${formatWan(val)} (${props.payload.percentage.toFixed(2)}%)`, 
                            name
                         ]} />
                         <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </Card>
               <Card title="业务员业绩排名">
                  <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={personStats.slice(0, 10)} layout="vertical" margin={{ left: 40 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={70} />
                           <RechartsTooltip 
                              cursor={{fill: '#f8fafc'}} 
                              formatter={(val: number) => [
                                 `${formatWan(val)}`,
                                 `占比: ${totalAmount > 0 ? (val / totalAmount * 100).toFixed(2) : 0}%`
                              ]} 
                            />
                           <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>

            {/* ADMIN ROW 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card title="品类销售占比">
                   <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={catStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {catStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                              </Pie>
                              <RechartsTooltip formatter={(val: number, name: string, props: any) => [
                                `${formatWan(val)} (${props.payload.percentage.toFixed(2)}%)`, 
                                name
                              ]} />
                           </PieChart>
                        </ResponsiveContainer>
                   </div>
               </Card>
               <Card title="小分类销售排行">
                  <PaginatedRankingList 
                    data={subCatStats} 
                    colorClass="bg-pink-500" 
                    titleCols={{ rank: '排名', name: '小分类', value: '销售额', percent: '占比' }}
                  />
               </Card>
            </div>

             {/* ADMIN ROW 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card title="客户贡献排名">
                  <PaginatedRankingList 
                    data={custStats} 
                    colorClass="bg-orange-500" 
                    titleCols={{ rank: '排名', name: '客户名称', value: '贡献额', percent: '占比' }}
                  />
               </Card>
               <Card title="单品销售排名">
                  <PaginatedRankingList 
                    data={prodStats} 
                    colorClass="bg-green-500" 
                    titleCols={{ rank: '排名', name: '单品名称', value: '销售额', percent: '占比' }}
                  />
               </Card>
            </div>
          </>
        ) : (
          <>
             {/* DEPT ROW 2 */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card title="团队业绩表现">
                  <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={personStats} margin={{bottom: 20}}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} angle={-30} textAnchor="end" />
                           <YAxis tickFormatter={(val) => `${val/10000}万`} />
                           <RechartsTooltip 
                              cursor={{fill: '#f8fafc'}} 
                              formatter={(val: number) => [
                                `${formatWan(val)}`,
                                `占比: ${totalAmount > 0 ? (val / totalAmount * 100).toFixed(2) : 0}%`
                              ]} 
                           />
                           <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               <Card title="品类组合分析">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={catStats} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                           {catStats.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <RechartsTooltip formatter={(val: number, name: string, props: any) => [
                            `${formatWan(val)} (${props.payload.percentage.toFixed(2)}%)`, 
                            name
                         ]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               </Card>
             </div>

             {/* DEPT ROW 3 */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card title="客户分布">
                  <PaginatedRankingList 
                    data={custStats} 
                    colorClass="bg-blue-500" 
                    titleCols={{ rank: '排名', name: '客户名称', value: '贡献额', percent: '占比' }}
                  />
               </Card>
               <Card title="小分类明细">
                  <PaginatedRankingList 
                    data={subCatStats} 
                    colorClass="bg-cyan-500" 
                    titleCols={{ rank: '排名', name: '小分类', value: '销售额', percent: '占比' }}
                  />
               </Card>
             </div>

             {/* DEPT ROW 4 */}
             <Card title="热销单品榜单">
                 <PaginatedRankingList 
                    data={prodStats} 
                    colorClass="bg-indigo-500" 
                    titleCols={{ rank: '排名', name: '单品名称', value: '销售额', percent: '占比' }}
                  />
             </Card>
          </>
        )}

      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default App;
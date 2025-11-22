import { GoogleGenAI } from "@google/genai";
import { DashboardMetrics } from "../types";

export const generateBusinessInsight = async (
  metrics: DashboardMetrics, 
  categoryData: {name: string, value: number}[],
  trendData: {date: string, amount: number}[]
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    return "错误: 环境变量中未找到 API Key。";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a summarized context to avoid token limits if data is huge
  const context = `
    销售仪表盘数据摘要:
    - 总销售额: ¥${metrics.totalRevenue.toLocaleString()}
    - 总销量: ${metrics.totalQuantity.toLocaleString()}
    - 总订单数: ${metrics.totalOrders}
    - 最佳品类: ${metrics.topCategory}

    销售额前5的品类:
    ${categoryData.slice(0, 5).map(c => `- ${c.name}: ¥${c.value.toLocaleString()}`).join('\n')}

    近5个月销售趋势:
    ${trendData.slice(-5).map(t => `- ${t.date}: ¥${t.amount.toLocaleString()}`).join('\n')}
  `;

  const prompt = `
    你是一位高级商业数据分析师。请根据以下销售摘要数据，提供一份简明扼要的战略分析报告。
    
    数据背景:
    ${context}

    请提供:
    1. 当前业绩的简要总结。
    2. 识别主要的收入驱动因素（“明星”品类）。
    3. 发现近期数据中的任何趋势或异常。
    4. 为销售团队提供一条可执行的建议。
    
    保持语气专业且富有鼓励性。请使用 Markdown 格式输出中文报告。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成分析失败，请检查 API Key 或网络连接。";
  }
};
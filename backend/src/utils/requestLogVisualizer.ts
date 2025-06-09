import fs from 'fs';
import path from 'path';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';

interface LogEntry {
  timestamp: string;
  path: string;
  method: string;
  status: number;
  executionTime: string;
  ip: string;
  userAgent: string;
}

interface ExecutionTimeEntry {
  path: string;
  time: number;
  status: number;
}

interface StatusCodeCounts {
  [code: string]: number;
}

interface PathCounts {
  [path: string]: number;
}

/**
 * 将API请求日志可视化为图表
 * 生成的图表显示请求路径、响应状态、执行时间和异常堆栈
 */
export const generateRequestLogVisualization = async (outputPath?: string): Promise<string | null> => {
  try {
    // 设置默认输出路径
    const defaultOutputDir = path.join(__dirname, '../../logs/visualizations');
    const defaultOutputFile = path.join(defaultOutputDir, `api-requests-visual-${Date.now()}.png`);
    const finalOutputPath = outputPath || defaultOutputFile;
    
    // 确保输出目录存在
    const outputDir = path.dirname(finalOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 读取日志文件
    const logFilePath = path.join(__dirname, '../../logs/api-requests.log');
    if (!fs.existsSync(logFilePath)) {
      console.error('Log file not found:', logFilePath);
      return null;
    }
    
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    const logEntries: LogEntry[] = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    // 只使用最近的100条日志
    const recentLogs = logEntries.slice(-100);
    
    // 分析日志数据
    const statusCodes: StatusCodeCounts = {};
    const pathCounts: PathCounts = {};
    const executionTimes: ExecutionTimeEntry[] = [];
    
    recentLogs.forEach(entry => {
      // 收集状态码统计
      const statusKey = entry.status.toString();
      statusCodes[statusKey] = (statusCodes[statusKey] || 0) + 1;
      
      // 收集路径统计
      const basePath = entry.path.split('?')[0].split('/').slice(0, 3).join('/');
      pathCounts[basePath] = (pathCounts[basePath] || 0) + 1;
      
      // 收集执行时间
      executionTimes.push({
        path: entry.path,
        time: parseFloat(entry.executionTime),
        status: entry.status
      });
    });
    
    // 按执行时间排序
    executionTimes.sort((a, b) => b.time - a.time);
    
    // 创建画布
    const width = 1200;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // 填充白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // 设置标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('API Request Log Visualization', 50, 50);
    ctx.font = '14px Arial';
    ctx.fillText(`Generated on ${new Date().toISOString()}`, 50, 80);
    
    // 绘制状态码分布
    drawStatusCodeDistribution(ctx as any, statusCodes, 50, 120, 500, 200);
    
    // 绘制最慢的10个请求
    drawSlowestRequests(ctx as any, executionTimes.slice(0, 10), 50, 350, 500, 400);
    
    // 绘制请求路径分布
    drawPathDistribution(ctx as any, pathCounts, 600, 120, 550, 630);
    
    // 保存图像
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(finalOutputPath, buffer);
    
    console.log(`Visualization saved to: ${finalOutputPath}`);
    return finalOutputPath;
  } catch (err) {
    console.error('Error generating log visualization:', err);
    return null;
  }
};

/**
 * 绘制状态码分布图
 */
function drawStatusCodeDistribution(
  ctx: any, 
  statusCodes: StatusCodeCounts, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): void {
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('HTTP Status Code Distribution', x, y);
  
  const totalRequests = Object.values(statusCodes).reduce((sum, count) => sum + count, 0);
  const statusCodeEntries = Object.entries(statusCodes).sort((a, b) => a[0].localeCompare(b[0]));
  
  const barHeight = 30;
  const spacing = 40;
  
  statusCodeEntries.forEach(([code, count], index) => {
    const percentage = count / totalRequests * 100;
    const barWidth = (width - 100) * (percentage / 100);
    
    // 根据状态码选择颜色
    let color = '#4CAF50'; // 成功 (2xx)
    if (code.startsWith('4')) {
      color = '#FF9800'; // 客户端错误 (4xx)
    } else if (code.startsWith('5')) {
      color = '#F44336'; // 服务器错误 (5xx)
    } else if (code.startsWith('3')) {
      color = '#2196F3'; // 重定向 (3xx)
    }
    
    // 绘制状态码标签
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText(`${code}`, x, y + spacing * (index + 1));
    
    // 绘制条形
    ctx.fillStyle = color;
    ctx.fillRect(x + 50, y + spacing * (index + 1) - barHeight/2, barWidth, barHeight);
    
    // 绘制计数和百分比
    ctx.fillStyle = '#333';
    ctx.fillText(`${count} (${percentage.toFixed(1)}%)`, x + 60 + barWidth, y + spacing * (index + 1) + 5);
  });
}

/**
 * 绘制最慢的请求列表
 */
function drawSlowestRequests(
  ctx: any, 
  executionTimes: ExecutionTimeEntry[], 
  x: number, 
  y: number, 
  width: number, 
  height: number
): void {
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Slowest Requests', x, y);
  
  ctx.font = '14px Arial';
  ctx.fillText('Path', x, y + 30);
  ctx.fillText('Status', x + 320, y + 30);
  ctx.fillText('Time (ms)', x + 400, y + 30);
  
  // 绘制分隔线
  ctx.strokeStyle = '#ccc';
  ctx.beginPath();
  ctx.moveTo(x, y + 40);
  ctx.lineTo(x + width, y + 40);
  ctx.stroke();
  
  // 列出最慢的请求
  executionTimes.forEach((entry, index) => {
    const rowY = y + 60 + index * 30;
    
    // 截断过长的路径
    let path = entry.path;
    if (path.length > 45) {
      path = path.substring(0, 42) + '...';
    }
    
    // 绘制路径
    ctx.fillStyle = '#333';
    ctx.fillText(path, x, rowY);
    
    // 绘制状态码（带颜色）
    let statusColor = '#4CAF50'; // 成功 (2xx)
    if (entry.status >= 400 && entry.status < 500) {
      statusColor = '#FF9800'; // 客户端错误 (4xx)
    } else if (entry.status >= 500) {
      statusColor = '#F44336'; // 服务器错误 (5xx)
    } else if (entry.status >= 300 && entry.status < 400) {
      statusColor = '#2196F3'; // 重定向 (3xx)
    }
    
    ctx.fillStyle = statusColor;
    ctx.fillText(entry.status.toString(), x + 320, rowY);
    
    // 绘制执行时间
    ctx.fillStyle = '#333';
    ctx.fillText(entry.time.toFixed(2), x + 400, rowY);
    
    // 添加交替行背景色
    if (index % 2 === 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(x, rowY - 15, width, 20);
    }
  });
}

/**
 * 绘制请求路径分布图
 */
function drawPathDistribution(
  ctx: any, 
  pathCounts: PathCounts, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): void {
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Request Path Distribution', x, y);
  
  const totalRequests = Object.values(pathCounts).reduce((sum, count) => sum + count, 0);
  const pathEntries = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // 只显示前15个路径
  
  // 设置饼图参数
  const centerX = x + width / 2;
  const centerY = y + height / 3;
  const radius = Math.min(width, height) / 3;
  
  // 绘制饼图
  let startAngle = 0;
  const colors = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', 
    '#009688', '#3F51B5', '#CDDC39', '#FF5722', '#607D8B',
    '#E91E63', '#FFC107', '#795548', '#9E9E9E', '#8BC34A'
  ];
  
  // 绘制图例
  ctx.font = '14px Arial';
  let legendY = y + height / 1.5;
  
  pathEntries.forEach(([path, count], index) => {
    const percentage = count / totalRequests * 100;
    const endAngle = startAngle + (Math.PI * 2 * (percentage / 100));
    
    // 绘制扇形
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
    
    // 绘制图例
    ctx.fillRect(x, legendY + index * 25, 15, 15);
    
    // 截断过长的路径
    let pathText = path;
    if (pathText.length > 30) {
      pathText = pathText.substring(0, 27) + '...';
    }
    
    ctx.fillStyle = '#333';
    ctx.fillText(`${pathText} - ${count} (${percentage.toFixed(1)}%)`, x + 25, legendY + 12 + index * 25);
    
    startAngle = endAngle;
  });
}

// 命令行调用
if (require.main === module) {
  generateRequestLogVisualization();
} 
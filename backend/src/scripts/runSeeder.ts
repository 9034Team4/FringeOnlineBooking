/**
 * 独立的数据库种子填充脚本
 * 可以直接运行: ts-node src/scripts/runSeeder.ts
 */

import { seed } from '../seeder';

console.log('开始执行数据库种子填充...');

seed()
  .then(() => {
    console.log('✅ 数据库种子填充成功完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 数据库种子填充失败:', error);
    process.exit(1);
  }); 
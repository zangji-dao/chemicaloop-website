/**
 * 脚本环境检查
 * 防止危险脚本在生产环境运行
 */

export function assertDevEnvironment() {
  const env = process.env.NODE_ENV;
  const isProduction = env === 'production';
  
  // 额外检查：是否有生产环境特征
  const hasProdFeatures = 
    process.env.DEPLOY_RUN_PORT || 
    process.env.COZE_DEPLOY_MODE;
  
  if (isProduction || hasProdFeatures) {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════╗');
    console.error('║                                                        ║');
    console.error('║   ❌ 安全拦截：此脚本禁止在生产环境运行                  ║');
    console.error('║                                                        ║');
    console.error('║   原因：此脚本会生成假数据或批量修改数据库               ║');
    console.error('║   如需运行，请联系 Tech Lead 审批                       ║');
    console.error('║                                                        ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }
  
  console.log('⚠️  警告：此脚本仅用于开发/测试环境');
  console.log('');
}

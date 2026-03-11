import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 化学结构图的 keys（按类别分组）
const CHEMICAL_STRUCTURE_KEYS = {
  solvents: [
    'chemical-structures/solvents_structure_765a401d.jpg',
    'chemical-structures/solvents_structure_cda135d1.jpg',
    'chemical-structures/solvents_structure_ff8189e5.jpg',
  ],
  acids: [
    'chemical-structures/acids_structure_0b8787b7.jpg',
    'chemical-structures/acids_structure_c27c5920.jpg',
    'chemical-structures/acids_structure_e7d4fb68.jpg',
  ],
  bases: [
    'chemical-structures/bases_structure_5686d8ce.jpg',
    'chemical-structures/bases_structure_a420ea32.jpg',
    'chemical-structures/bases_structure_c9f23046.jpg',
  ],
  salts: [
    'chemical-structures/salts_structure_85aac202.jpg',
    'chemical-structures/salts_structure_f56f2a4f.jpg',
    'chemical-structures/salts_structure_fdabda5b.jpg',
  ],
  polymers: [
    'chemical-structures/polymers_structure_1a2bfd94.jpg',
    'chemical-structures/polymers_structure_899f2390.jpg',
    'chemical-structures/polymers_structure_bc62e4d6.jpg',
  ],
  additives: [
    'chemical-structures/additives_structure_16d9ef76.jpg',
    'chemical-structures/additives_structure_9de0a8a3.jpg',
    'chemical-structures/additives_structure_a599a3d4.jpg',
  ],
};

export async function GET() {
  try {
    // 生成所有化学结构图的签名 URL
    const structureUrls: Record<string, string[]> = {};
    
    for (const [category, keys] of Object.entries(CHEMICAL_STRUCTURE_KEYS)) {
      const urls = await Promise.all(
        keys.map(async (key) => {
          const url = await storage.generatePresignedUrl({
            key,
            expireTime: 86400 * 7, // 7天有效期
          });
          return url;
        })
      );
      structureUrls[category] = urls;
    }

    return NextResponse.json({
      success: true,
      structures: structureUrls,
    });
  } catch (error) {
    console.error('Error generating chemical structure URLs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate structure URLs',
      },
      { status: 500 }
    );
  }
}

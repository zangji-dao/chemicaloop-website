// 全球国家、省份/州、城市数据
// 格式: 国家 -> 省份/州 -> 城市

export interface City {
  name: string;
  nameZh?: string;
}

export interface Province {
  name: string;
  nameZh?: string;
  cities: City[];
}

export interface Country {
  code: string;
  name: string;
  nameZh: string;
  provinces: Province[];
}

// 中国数据
const chinaProvinces: Province[] = [
  {
    name: 'Beijing',
    nameZh: '北京市',
    cities: [
      { name: 'Beijing', nameZh: '北京市' },
      { name: 'Dongcheng', nameZh: '东城区' },
      { name: 'Xicheng', nameZh: '西城区' },
      { name: 'Chaoyang', nameZh: '朝阳区' },
      { name: 'Haidian', nameZh: '海淀区' },
    ]
  },
  {
    name: 'Shanghai',
    nameZh: '上海市',
    cities: [
      { name: 'Shanghai', nameZh: '上海市' },
      { name: 'Huangpu', nameZh: '黄浦区' },
      { name: 'Xuhui', nameZh: '徐汇区' },
      { name: 'Pudong', nameZh: '浦东新区' },
    ]
  },
  {
    name: 'Guangdong',
    nameZh: '广东省',
    cities: [
      { name: 'Guangzhou', nameZh: '广州市' },
      { name: 'Shenzhen', nameZh: '深圳市' },
      { name: 'Dongguan', nameZh: '东莞市' },
      { name: 'Foshan', nameZh: '佛山市' },
      { name: 'Zhuhai', nameZh: '珠海市' },
    ]
  },
  {
    name: 'Jiangsu',
    nameZh: '江苏省',
    cities: [
      { name: 'Nanjing', nameZh: '南京市' },
      { name: 'Suzhou', nameZh: '苏州市' },
      { name: 'Wuxi', nameZh: '无锡市' },
      { name: 'Changzhou', nameZh: '常州市' },
    ]
  },
  {
    name: 'Zhejiang',
    nameZh: '浙江省',
    cities: [
      { name: 'Hangzhou', nameZh: '杭州市' },
      { name: 'Ningbo', nameZh: '宁波市' },
      { name: 'Wenzhou', nameZh: '温州市' },
    ]
  },
  {
    name: 'Sichuan',
    nameZh: '四川省',
    cities: [
      { name: 'Chengdu', nameZh: '成都市' },
      { name: 'Mianyang', nameZh: '绵阳市' },
    ]
  },
  {
    name: 'Hubei',
    nameZh: '湖北省',
    cities: [
      { name: 'Wuhan', nameZh: '武汉市' },
      { name: 'Yichang', nameZh: '宜昌市' },
    ]
  },
  {
    name: 'Hunan',
    nameZh: '湖南省',
    cities: [
      { name: 'Changsha', nameZh: '长沙市' },
      { name: 'Zhuzhou', nameZh: '株洲市' },
    ]
  },
  {
    name: 'Shandong',
    nameZh: '山东省',
    cities: [
      { name: 'Jinan', nameZh: '济南市' },
      { name: 'Qingdao', nameZh: '青岛市' },
      { name: 'Yantai', nameZh: '烟台市' },
    ]
  },
  {
    name: 'Fujian',
    nameZh: '福建省',
    cities: [
      { name: 'Fuzhou', nameZh: '福州市' },
      { name: 'Xiamen', nameZh: '厦门市' },
      { name: 'Quanzhou', nameZh: '泉州市' },
    ]
  },
  {
    name: 'Henan',
    nameZh: '河南省',
    cities: [
      { name: 'Zhengzhou', nameZh: '郑州市' },
      { name: 'Luoyang', nameZh: '洛阳市' },
    ]
  },
  {
    name: 'Hebei',
    nameZh: '河北省',
    cities: [
      { name: 'Shijiazhuang', nameZh: '石家庄市' },
      { name: 'Tangshan', nameZh: '唐山市' },
    ]
  },
  {
    name: 'Anhui',
    nameZh: '安徽省',
    cities: [
      { name: 'Hefei', nameZh: '合肥市' },
      { name: 'Wuhu', nameZh: '芜湖市' },
    ]
  },
  {
    name: 'Liaoning',
    nameZh: '辽宁省',
    cities: [
      { name: 'Shenyang', nameZh: '沈阳市' },
      { name: 'Dalian', nameZh: '大连市' },
    ]
  },
  {
    name: 'Shaanxi',
    nameZh: '陕西省',
    cities: [
      { name: "Xi'an", nameZh: '西安市' },
      { name: 'Xianyang', nameZh: '咸阳市' },
    ]
  },
  {
    name: 'Jilin',
    nameZh: '吉林省',
    cities: [
      { name: 'Changchun', nameZh: '长春市' },
      { name: 'Jilin', nameZh: '吉林市' },
      { name: 'Siping', nameZh: '四平市' },
      { name: 'Songyuan', nameZh: '松原市' },
      { name: 'Tonghua', nameZh: '通化市' },
    ]
  },
  {
    name: 'Heilongjiang',
    nameZh: '黑龙江省',
    cities: [
      { name: 'Harbin', nameZh: '哈尔滨市' },
      { name: 'Qiqihar', nameZh: '齐齐哈尔市' },
    ]
  },
  {
    name: 'Tianjin',
    nameZh: '天津市',
    cities: [
      { name: 'Tianjin', nameZh: '天津市' },
    ]
  },
  {
    name: 'Chongqing',
    nameZh: '重庆市',
    cities: [
      { name: 'Chongqing', nameZh: '重庆市' },
    ]
  },
  {
    name: 'Hong Kong',
    nameZh: '香港特别行政区',
    cities: [
      { name: 'Hong Kong', nameZh: '香港' },
    ]
  },
  {
    name: 'Macau',
    nameZh: '澳门特别行政区',
    cities: [
      { name: 'Macau', nameZh: '澳门' },
    ]
  },
  {
    name: 'Taiwan',
    nameZh: '台湾省',
    cities: [
      { name: 'Taipei', nameZh: '台北市' },
      { name: 'Kaohsiung', nameZh: '高雄市' },
      { name: 'Taichung', nameZh: '台中市' },
    ]
  },
];

// 美国数据
const usaProvinces: Province[] = [
  {
    name: 'California',
    nameZh: '加利福尼亚州',
    cities: [
      { name: 'Los Angeles' },
      { name: 'San Francisco' },
      { name: 'San Diego' },
      { name: 'San Jose' },
      { name: 'Sacramento' },
    ]
  },
  {
    name: 'New York',
    nameZh: '纽约州',
    cities: [
      { name: 'New York City' },
      { name: 'Buffalo' },
      { name: 'Rochester' },
    ]
  },
  {
    name: 'Texas',
    nameZh: '德克萨斯州',
    cities: [
      { name: 'Houston' },
      { name: 'Dallas' },
      { name: 'Austin' },
      { name: 'San Antonio' },
    ]
  },
  {
    name: 'Florida',
    nameZh: '佛罗里达州',
    cities: [
      { name: 'Miami' },
      { name: 'Orlando' },
      { name: 'Tampa' },
    ]
  },
  {
    name: 'Illinois',
    nameZh: '伊利诺伊州',
    cities: [
      { name: 'Chicago' },
    ]
  },
  {
    name: 'Washington',
    nameZh: '华盛顿州',
    cities: [
      { name: 'Seattle' },
      { name: 'Spokane' },
    ]
  },
  {
    name: 'Massachusetts',
    nameZh: '马萨诸塞州',
    cities: [
      { name: 'Boston' },
    ]
  },
  {
    name: 'Pennsylvania',
    nameZh: '宾夕法尼亚州',
    cities: [
      { name: 'Philadelphia' },
      { name: 'Pittsburgh' },
    ]
  },
];

// 日本数据
const japanProvinces: Province[] = [
  {
    name: 'Tokyo',
    nameZh: '东京都',
    cities: [
      { name: 'Tokyo', nameZh: '东京' },
      { name: 'Shinjuku', nameZh: '新宿' },
      { name: 'Shibuya', nameZh: '涩谷' },
    ]
  },
  {
    name: 'Osaka',
    nameZh: '大阪府',
    cities: [
      { name: 'Osaka', nameZh: '大阪' },
    ]
  },
  {
    name: 'Kyoto',
    nameZh: '京都府',
    cities: [
      { name: 'Kyoto', nameZh: '京都' },
    ]
  },
  {
    name: 'Kanagawa',
    nameZh: '神奈川县',
    cities: [
      { name: 'Yokohama', nameZh: '横滨' },
    ]
  },
  {
    name: 'Aichi',
    nameZh: '爱知县',
    cities: [
      { name: 'Nagoya', nameZh: '名古屋' },
    ]
  },
  {
    name: 'Hokkaido',
    nameZh: '北海道',
    cities: [
      { name: 'Sapporo', nameZh: '札幌' },
    ]
  },
  {
    name: 'Fukuoka',
    nameZh: '福冈县',
    cities: [
      { name: 'Fukuoka', nameZh: '福冈' },
    ]
  },
];

// 德国数据
const germanyProvinces: Province[] = [
  {
    name: 'Bavaria',
    nameZh: '巴伐利亚州',
    cities: [
      { name: 'Munich', nameZh: '慕尼黑' },
      { name: 'Nuremberg', nameZh: '纽伦堡' },
    ]
  },
  {
    name: 'Berlin',
    nameZh: '柏林',
    cities: [
      { name: 'Berlin', nameZh: '柏林' },
    ]
  },
  {
    name: 'Hamburg',
    nameZh: '汉堡',
    cities: [
      { name: 'Hamburg', nameZh: '汉堡' },
    ]
  },
  {
    name: 'Hesse',
    nameZh: '黑森州',
    cities: [
      { name: 'Frankfurt', nameZh: '法兰克福' },
    ]
  },
  {
    name: 'North Rhine-Westphalia',
    nameZh: '北莱茵-威斯特法伦州',
    cities: [
      { name: 'Cologne', nameZh: '科隆' },
      { name: 'Düsseldorf', nameZh: '杜塞尔多夫' },
    ]
  },
  {
    name: 'Baden-Württemberg',
    nameZh: '巴登-符腾堡州',
    cities: [
      { name: 'Stuttgart', nameZh: '斯图加特' },
    ]
  },
];

// 英国数据
const ukProvinces: Province[] = [
  {
    name: 'England',
    nameZh: '英格兰',
    cities: [
      { name: 'London', nameZh: '伦敦' },
      { name: 'Manchester', nameZh: '曼彻斯特' },
      { name: 'Birmingham', nameZh: '伯明翰' },
      { name: 'Liverpool', nameZh: '利物浦' },
    ]
  },
  {
    name: 'Scotland',
    nameZh: '苏格兰',
    cities: [
      { name: 'Edinburgh', nameZh: '爱丁堡' },
      { name: 'Glasgow', nameZh: '格拉斯哥' },
    ]
  },
  {
    name: 'Wales',
    nameZh: '威尔士',
    cities: [
      { name: 'Cardiff', nameZh: '卡迪夫' },
    ]
  },
  {
    name: 'Northern Ireland',
    nameZh: '北爱尔兰',
    cities: [
      { name: 'Belfast', nameZh: '贝尔法斯特' },
    ]
  },
];

// 法国数据
const franceProvinces: Province[] = [
  {
    name: 'Île-de-France',
    nameZh: '法兰西岛',
    cities: [
      { name: 'Paris', nameZh: '巴黎' },
    ]
  },
  {
    name: 'Auvergne-Rhône-Alpes',
    nameZh: '奥弗涅-罗讷-阿尔卑斯',
    cities: [
      { name: 'Lyon', nameZh: '里昂' },
    ]
  },
  {
    name: 'Provence-Alpes-Côte d\'Azur',
    nameZh: '普罗旺斯-阿尔卑斯-蔚蓝海岸',
    cities: [
      { name: 'Marseille', nameZh: '马赛' },
      { name: 'Nice', nameZh: '尼斯' },
    ]
  },
  {
    name: 'Nouvelle-Aquitaine',
    nameZh: '新阿基坦',
    cities: [
      { name: 'Bordeaux', nameZh: '波尔多' },
    ]
  },
];

// 意大利数据
const italyProvinces: Province[] = [
  {
    name: 'Lazio',
    nameZh: '拉齐奥',
    cities: [
      { name: 'Rome', nameZh: '罗马' },
    ]
  },
  {
    name: 'Lombardy',
    nameZh: '伦巴第',
    cities: [
      { name: 'Milan', nameZh: '米兰' },
    ]
  },
  {
    name: 'Tuscany',
    nameZh: '托斯卡纳',
    cities: [
      { name: 'Florence', nameZh: '佛罗伦萨' },
    ]
  },
  {
    name: 'Veneto',
    nameZh: '威尼托',
    cities: [
      { name: 'Venice', nameZh: '威尼斯' },
    ]
  },
];

// 韩国数据
const koreaProvinces: Province[] = [
  {
    name: 'Seoul',
    nameZh: '首尔特别市',
    cities: [
      { name: 'Seoul', nameZh: '首尔' },
    ]
  },
  {
    name: 'Busan',
    nameZh: '釜山广域市',
    cities: [
      { name: 'Busan', nameZh: '釜山' },
    ]
  },
  {
    name: 'Gyeonggi',
    nameZh: '京畿道',
    cities: [
      { name: 'Suwon', nameZh: '水原' },
    ]
  },
  {
    name: 'Incheon',
    nameZh: '仁川广域市',
    cities: [
      { name: 'Incheon', nameZh: '仁川' },
    ]
  },
];

// 加拿大数据
const canadaProvinces: Province[] = [
  {
    name: 'Ontario',
    nameZh: '安大略省',
    cities: [
      { name: 'Toronto', nameZh: '多伦多' },
      { name: 'Ottawa', nameZh: '渥太华' },
    ]
  },
  {
    name: 'British Columbia',
    nameZh: '不列颠哥伦比亚省',
    cities: [
      { name: 'Vancouver', nameZh: '温哥华' },
    ]
  },
  {
    name: 'Quebec',
    nameZh: '魁北克省',
    cities: [
      { name: 'Montreal', nameZh: '蒙特利尔' },
      { name: 'Quebec City', nameZh: '魁北克城' },
    ]
  },
  {
    name: 'Alberta',
    nameZh: '阿尔伯塔省',
    cities: [
      { name: 'Calgary', nameZh: '卡尔加里' },
      { name: 'Edmonton', nameZh: '埃德蒙顿' },
    ]
  },
];

// 澳大利亚数据
const australiaProvinces: Province[] = [
  {
    name: 'New South Wales',
    nameZh: '新南威尔士州',
    cities: [
      { name: 'Sydney', nameZh: '悉尼' },
    ]
  },
  {
    name: 'Victoria',
    nameZh: '维多利亚州',
    cities: [
      { name: 'Melbourne', nameZh: '墨尔本' },
    ]
  },
  {
    name: 'Queensland',
    nameZh: '昆士兰州',
    cities: [
      { name: 'Brisbane', nameZh: '布里斯班' },
    ]
  },
  {
    name: 'Western Australia',
    nameZh: '西澳大利亚州',
    cities: [
      { name: 'Perth', nameZh: '珀斯' },
    ]
  },
];

// 印度数据
const indiaProvinces: Province[] = [
  {
    name: 'Maharashtra',
    nameZh: '马哈拉施特拉邦',
    cities: [
      { name: 'Mumbai', nameZh: '孟买' },
      { name: 'Pune', nameZh: '浦那' },
    ]
  },
  {
    name: 'Delhi',
    nameZh: '德里',
    cities: [
      { name: 'New Delhi', nameZh: '新德里' },
    ]
  },
  {
    name: 'Karnataka',
    nameZh: '卡纳塔克邦',
    cities: [
      { name: 'Bangalore', nameZh: '班加罗尔' },
    ]
  },
  {
    name: 'Tamil Nadu',
    nameZh: '泰米尔纳德邦',
    cities: [
      { name: 'Chennai', nameZh: '金奈' },
    ]
  },
];

// 巴西数据
const brazilProvinces: Province[] = [
  {
    name: 'São Paulo',
    nameZh: '圣保罗州',
    cities: [
      { name: 'São Paulo', nameZh: '圣保罗' },
    ]
  },
  {
    name: 'Rio de Janeiro',
    nameZh: '里约热内卢州',
    cities: [
      { name: 'Rio de Janeiro', nameZh: '里约热内卢' },
    ]
  },
  {
    name: 'Distrito Federal',
    nameZh: '联邦区',
    cities: [
      { name: 'Brasília', nameZh: '巴西利亚' },
    ]
  },
];

// 俄罗斯数据
const russiaProvinces: Province[] = [
  {
    name: 'Moscow',
    nameZh: '莫斯科',
    cities: [
      { name: 'Moscow', nameZh: '莫斯科' },
    ]
  },
  {
    name: 'Saint Petersburg',
    nameZh: '圣彼得堡',
    cities: [
      { name: 'Saint Petersburg', nameZh: '圣彼得堡' },
    ]
  },
];

// 新加坡数据
const singaporeProvinces: Province[] = [
  {
    name: 'Singapore',
    nameZh: '新加坡',
    cities: [
      { name: 'Singapore', nameZh: '新加坡' },
    ]
  },
];

// 泰国数据
const thailandProvinces: Province[] = [
  {
    name: 'Bangkok',
    nameZh: '曼谷',
    cities: [
      { name: 'Bangkok', nameZh: '曼谷' },
    ]
  },
  {
    name: 'Chiang Mai',
    nameZh: '清迈',
    cities: [
      { name: 'Chiang Mai', nameZh: '清迈' },
    ]
  },
];

// 越南数据
const vietnamProvinces: Province[] = [
  {
    name: 'Ho Chi Minh City',
    nameZh: '胡志明市',
    cities: [
      { name: 'Ho Chi Minh City', nameZh: '胡志明市' },
    ]
  },
  {
    name: 'Hanoi',
    nameZh: '河内',
    cities: [
      { name: 'Hanoi', nameZh: '河内' },
    ]
  },
];

// 马来西亚数据
const malaysiaProvinces: Province[] = [
  {
    name: 'Kuala Lumpur',
    nameZh: '吉隆坡',
    cities: [
      { name: 'Kuala Lumpur', nameZh: '吉隆坡' },
    ]
  },
  {
    name: 'Selangor',
    nameZh: '雪兰莪',
    cities: [
      { name: 'Petaling Jaya', nameZh: '八打灵再也' },
    ]
  },
];

// 印度尼西亚数据
const indonesiaProvinces: Province[] = [
  {
    name: 'Jakarta',
    nameZh: '雅加达',
    cities: [
      { name: 'Jakarta', nameZh: '雅加达' },
    ]
  },
  {
    name: 'Bali',
    nameZh: '巴厘省',
    cities: [
      { name: 'Denpasar', nameZh: '登巴萨' },
    ]
  },
];

// 荷兰数据
const netherlandsProvinces: Province[] = [
  {
    name: 'North Holland',
    nameZh: '北荷兰省',
    cities: [
      { name: 'Amsterdam', nameZh: '阿姆斯特丹' },
    ]
  },
  {
    name: 'South Holland',
    nameZh: '南荷兰省',
    cities: [
      { name: 'Rotterdam', nameZh: '鹿特丹' },
      { name: 'The Hague', nameZh: '海牙' },
    ]
  },
];

// 瑞士数据
const switzerlandProvinces: Province[] = [
  {
    name: 'Zurich',
    nameZh: '苏黎世州',
    cities: [
      { name: 'Zurich', nameZh: '苏黎世' },
    ]
  },
  {
    name: 'Geneva',
    nameZh: '日内瓦州',
    cities: [
      { name: 'Geneva', nameZh: '日内瓦' },
    ]
  },
];

// 西班牙数据
const spainProvinces: Province[] = [
  {
    name: 'Madrid',
    nameZh: '马德里',
    cities: [
      { name: 'Madrid', nameZh: '马德里' },
    ]
  },
  {
    name: 'Catalonia',
    nameZh: '加泰罗尼亚',
    cities: [
      { name: 'Barcelona', nameZh: '巴塞罗那' },
    ]
  },
];

// 阿联酋数据
const uaeProvinces: Province[] = [
  {
    name: 'Dubai',
    nameZh: '迪拜',
    cities: [
      { name: 'Dubai', nameZh: '迪拜' },
    ]
  },
  {
    name: 'Abu Dhabi',
    nameZh: '阿布扎比',
    cities: [
      { name: 'Abu Dhabi', nameZh: '阿布扎比' },
    ]
  },
];

// 沙特阿拉伯数据
const saudiArabiaProvinces: Province[] = [
  {
    name: 'Riyadh',
    nameZh: '利雅得省',
    cities: [
      { name: 'Riyadh', nameZh: '利雅得' },
    ]
  },
  {
    name: 'Makkah',
    nameZh: '麦加省',
    cities: [
      { name: 'Jeddah', nameZh: '吉达' },
      { name: 'Mecca', nameZh: '麦加' },
    ]
  },
];

// 墨西哥数据
const mexicoProvinces: Province[] = [
  {
    name: 'Mexico City',
    nameZh: '墨西哥城',
    cities: [
      { name: 'Mexico City', nameZh: '墨西哥城' },
    ]
  },
  {
    name: 'Jalisco',
    nameZh: '哈利斯科州',
    cities: [
      { name: 'Guadalajara', nameZh: '瓜达拉哈拉' },
    ]
  },
];

// 南非数据
const southAfricaProvinces: Province[] = [
  {
    name: 'Gauteng',
    nameZh: '豪登省',
    cities: [
      { name: 'Johannesburg', nameZh: '约翰内斯堡' },
      { name: 'Pretoria', nameZh: '比勒陀利亚' },
    ]
  },
  {
    name: 'Western Cape',
    nameZh: '西开普省',
    cities: [
      { name: 'Cape Town', nameZh: '开普敦' },
    ]
  },
];

// 所有国家数据
export const countries: Country[] = [
  { code: 'CN', name: 'China', nameZh: '中国', provinces: chinaProvinces },
  { code: 'US', name: 'United States', nameZh: '美国', provinces: usaProvinces },
  { code: 'JP', name: 'Japan', nameZh: '日本', provinces: japanProvinces },
  { code: 'DE', name: 'Germany', nameZh: '德国', provinces: germanyProvinces },
  { code: 'GB', name: 'United Kingdom', nameZh: '英国', provinces: ukProvinces },
  { code: 'FR', name: 'France', nameZh: '法国', provinces: franceProvinces },
  { code: 'IT', name: 'Italy', nameZh: '意大利', provinces: italyProvinces },
  { code: 'KR', name: 'South Korea', nameZh: '韩国', provinces: koreaProvinces },
  { code: 'CA', name: 'Canada', nameZh: '加拿大', provinces: canadaProvinces },
  { code: 'AU', name: 'Australia', nameZh: '澳大利亚', provinces: australiaProvinces },
  { code: 'IN', name: 'India', nameZh: '印度', provinces: indiaProvinces },
  { code: 'BR', name: 'Brazil', nameZh: '巴西', provinces: brazilProvinces },
  { code: 'RU', name: 'Russia', nameZh: '俄罗斯', provinces: russiaProvinces },
  { code: 'SG', name: 'Singapore', nameZh: '新加坡', provinces: singaporeProvinces },
  { code: 'TH', name: 'Thailand', nameZh: '泰国', provinces: thailandProvinces },
  { code: 'VN', name: 'Vietnam', nameZh: '越南', provinces: vietnamProvinces },
  { code: 'MY', name: 'Malaysia', nameZh: '马来西亚', provinces: malaysiaProvinces },
  { code: 'ID', name: 'Indonesia', nameZh: '印度尼西亚', provinces: indonesiaProvinces },
  { code: 'NL', name: 'Netherlands', nameZh: '荷兰', provinces: netherlandsProvinces },
  { code: 'CH', name: 'Switzerland', nameZh: '瑞士', provinces: switzerlandProvinces },
  { code: 'ES', name: 'Spain', nameZh: '西班牙', provinces: spainProvinces },
  { code: 'AE', name: 'United Arab Emirates', nameZh: '阿联酋', provinces: uaeProvinces },
  { code: 'SA', name: 'Saudi Arabia', nameZh: '沙特阿拉伯', provinces: saudiArabiaProvinces },
  { code: 'MX', name: 'Mexico', nameZh: '墨西哥', provinces: mexicoProvinces },
  { code: 'ZA', name: 'South Africa', nameZh: '南非', provinces: southAfricaProvinces },
];

// 获取省份列表
export function getProvinces(countryCode: string): Province[] {
  const country = countries.find(c => c.code === countryCode);
  return country?.provinces || [];
}

// 获取城市列表
export function getCities(countryCode: string, provinceName: string): City[] {
  const country = countries.find(c => c.code === countryCode);
  const province = country?.provinces.find(p => p.name === provinceName);
  return province?.cities || [];
}

// 根据名称查找国家
export function findCountryByName(name: string): Country | undefined {
  return countries.find(c => 
    c.name.toLowerCase() === name.toLowerCase() ||
    c.nameZh === name ||
    c.code.toLowerCase() === name.toLowerCase()
  );
}

// 根据名称查找省份
export function findProvinceByName(countryCode: string, name: string): Province | undefined {
  const country = countries.find(c => c.code === countryCode);
  if (!country) return undefined;
  return country.provinces.find(p => 
    p.name.toLowerCase() === name.toLowerCase() ||
    p.nameZh === name
  );
}

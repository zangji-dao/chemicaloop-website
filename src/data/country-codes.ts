/**
 * UN Comtrade 国家代码 (M49 标准)
 * 包含所有有贸易数据的国家和地区
 * 
 * 数据来源: UN Statistics Division M49 Standard
 * https://unstats.un.org/unsd/methodology/m49/
 */

export interface Country {
  code: string;
  name: string;
  nameEn: string;
  region: string; // 地区分类
}

/**
 * 报告国列表（有贸易数据的国家/地区）
 * 按贸易活跃度排序，常用国家靠前
 */
export const REPORTER_COUNTRIES: Country[] = [
  // 东亚
  { code: '156', name: '中国', nameEn: 'China', region: '东亚' },
  { code: '410', name: '韩国', nameEn: 'South Korea', region: '东亚' },
  { code: '392', name: '日本', nameEn: 'Japan', region: '东亚' },
  { code: '158', name: '台湾', nameEn: 'Taiwan', region: '东亚' },
  { code: '344', name: '香港', nameEn: 'Hong Kong', region: '东亚' },
  { code: '446', name: '澳门', nameEn: 'Macau', region: '东亚' },
  { code: '408', name: '朝鲜', nameEn: 'North Korea', region: '东亚' },
  { code: '496', name: '蒙古', nameEn: 'Mongolia', region: '东亚' },

  // 东南亚
  { code: '702', name: '新加坡', nameEn: 'Singapore', region: '东南亚' },
  { code: '764', name: '泰国', nameEn: 'Thailand', region: '东南亚' },
  { code: '458', name: '马来西亚', nameEn: 'Malaysia', region: '东南亚' },
  { code: '360', name: '印度尼西亚', nameEn: 'Indonesia', region: '东南亚' },
  { code: '704', name: '越南', nameEn: 'Vietnam', region: '东南亚' },
  { code: '116', name: '柬埔寨', nameEn: 'Cambodia', region: '东南亚' },
  { code: '418', name: '老挝', nameEn: 'Laos', region: '东南亚' },
  { code: '104', name: '缅甸', nameEn: 'Myanmar', region: '东南亚' },
  { code: '608', name: '菲律宾', nameEn: 'Philippines', region: '东南亚' },
  { code: '626', name: '东帝汶', nameEn: 'Timor-Leste', region: '东南亚' },
  { code: '096', name: '文莱', nameEn: 'Brunei', region: '东南亚' },

  // 南亚
  { code: '356', name: '印度', nameEn: 'India', region: '南亚' },
  { code: '144', name: '斯里兰卡', nameEn: 'Sri Lanka', region: '南亚' },
  { code: '050', name: '孟加拉国', nameEn: 'Bangladesh', region: '南亚' },
  { code: '051', name: '亚美尼亚', nameEn: 'Armenia', region: '南亚' },
  { code: '031', name: '阿塞拜疆', nameEn: 'Azerbaijan', region: '南亚' },
  { code: '046', name: '不丹', nameEn: 'Bhutan', region: '南亚' },
  { code: '074', name: '马尔代夫', nameEn: 'Maldives', region: '南亚' },
  { code: '586', name: '巴基斯坦', nameEn: 'Pakistan', region: '南亚' },
  { code: '004', name: '阿富汗', nameEn: 'Afghanistan', region: '南亚' },

  // 中亚
  { code: '398', name: '哈萨克斯坦', nameEn: 'Kazakhstan', region: '中亚' },
  { code: '417', name: '吉尔吉斯斯坦', nameEn: 'Kyrgyzstan', region: '中亚' },
  { code: '762', name: '塔吉克斯坦', nameEn: 'Tajikistan', region: '中亚' },
  { code: '795', name: '土库曼斯坦', nameEn: 'Turkmenistan', region: '中亚' },
  { code: '860', name: '乌兹别克斯坦', nameEn: 'Uzbekistan', region: '中亚' },

  // 西亚/中东
  { code: '792', name: '土耳其', nameEn: 'Turkey', region: '西亚' },
  { code: '784', name: '阿联酋', nameEn: 'United Arab Emirates', region: '西亚' },
  { code: '682', name: '沙特阿拉伯', nameEn: 'Saudi Arabia', region: '西亚' },
  { code: '364', name: '伊朗', nameEn: 'Iran', region: '西亚' },
  { code: '368', name: '伊拉克', nameEn: 'Iraq', region: '西亚' },
  { code: '376', name: '以色列', nameEn: 'Israel', region: '西亚' },
  { code: '400', name: '约旦', nameEn: 'Jordan', region: '西亚' },
  { code: '414', name: '科威特', nameEn: 'Kuwait', region: '西亚' },
  { code: '422', name: '黎巴嫩', nameEn: 'Lebanon', region: '西亚' },
  { code: '512', name: '阿曼', nameEn: 'Oman', region: '西亚' },
  { code: '634', name: '卡塔尔', nameEn: 'Qatar', region: '西亚' },
  { code: '760', name: '叙利亚', nameEn: 'Syria', region: '西亚' },
  { code: '887', name: '也门', nameEn: 'Yemen', region: '西亚' },
  { code: '818', name: '埃及', nameEn: 'Egypt', region: '西亚' },

  // 欧洲 - 西欧
  { code: '276', name: '德国', nameEn: 'Germany', region: '西欧' },
  { code: '826', name: '英国', nameEn: 'United Kingdom', region: '西欧' },
  { code: '250', name: '法国', nameEn: 'France', region: '西欧' },
  { code: '380', name: '意大利', nameEn: 'Italy', region: '西欧' },
  { code: '724', name: '西班牙', nameEn: 'Spain', region: '西欧' },
  { code: '020', name: '安道尔', nameEn: 'Andorra', region: '西欧' },
  { code: '056', name: '比利时', nameEn: 'Belgium', region: '西欧' },
  { code: '208', name: '丹麦', nameEn: 'Denmark', region: '西欧' },
  { code: '246', name: '芬兰', nameEn: 'Finland', region: '西欧' },
  { code: '300', name: '希腊', nameEn: 'Greece', region: '西欧' },
  { code: '372', name: '爱尔兰', nameEn: 'Ireland', region: '西欧' },
  { code: '438', name: '列支敦士登', nameEn: 'Liechtenstein', region: '西欧' },
  { code: '442', name: '卢森堡', nameEn: 'Luxembourg', region: '西欧' },
  { code: '470', name: '马耳他', nameEn: 'Malta', region: '西欧' },
  { code: '528', name: '荷兰', nameEn: 'Netherlands', region: '西欧' },
  { code: '620', name: '葡萄牙', nameEn: 'Portugal', region: '西欧' },
  { code: '752', name: '瑞典', nameEn: 'Sweden', region: '西欧' },
  { code: '756', name: '瑞士', nameEn: 'Switzerland', region: '西欧' },
  { code: '830', name: '海峡群岛', nameEn: 'Channel Islands', region: '西欧' },
  { code: '833', name: '马恩岛', nameEn: 'Isle of Man', region: '西欧' },

  // 欧洲 - 东欧
  { code: '643', name: '俄罗斯', nameEn: 'Russia', region: '东欧' },
  { code: '112', name: '白俄罗斯', nameEn: 'Belarus', region: '东欧' },
  { code: '498', name: '摩尔多瓦', nameEn: 'Moldova', region: '东欧' },
  { code: '757', name: '摩尔多瓦', nameEn: 'Moldova', region: '东欧' }, // 备用代码
  { code: '804', name: '乌克兰', nameEn: 'Ukraine', region: '东欧' },

  // 欧洲 - 北欧
  { code: '248', name: '奥兰群岛', nameEn: 'Åland Islands', region: '北欧' },
  { code: '233', name: '爱沙尼亚', nameEn: 'Estonia', region: '北欧' },
  { code: '428', name: '拉脱维亚', nameEn: 'Latvia', region: '北欧' },
  { code: '440', name: '立陶宛', nameEn: 'Lithuania', region: '北欧' },
  { code: '578', name: '挪威', nameEn: 'Norway', region: '北欧' },
  { code: '840', name: '斯瓦尔巴群岛', nameEn: 'Svalbard', region: '北欧' },

  // 欧洲 - 中欧/东欧
  { code: '036', name: '澳大利亚', nameEn: 'Australia', region: '大洋洲' },
  { code: '040', name: '奥地利', nameEn: 'Austria', region: '西欧' },
  { code: '100', name: '保加利亚', nameEn: 'Bulgaria', region: '东欧' },
  { code: '196', name: '塞浦路斯', nameEn: 'Cyprus', region: '南欧' },
  { code: '203', name: '捷克', nameEn: 'Czech Republic', region: '中欧' },
  { code: '616', name: '波兰', nameEn: 'Poland', region: '东欧' },
  { code: '642', name: '罗马尼亚', nameEn: 'Romania', region: '东欧' },
  { code: '703', name: '斯洛伐克', nameEn: 'Slovakia', region: '中欧' },
  { code: '251', name: '法国', nameEn: 'France', region: '西欧' }, // 备用代码

  // 欧洲 - 南欧
  { code: '008', name: '阿尔巴尼亚', nameEn: 'Albania', region: '南欧' },
  { code: '070', name: '波黑', nameEn: 'Bosnia and Herzegovina', region: '南欧' },
  { code: '191', name: '克罗地亚', nameEn: 'Croatia', region: '南欧' },
  { code: '348', name: '匈牙利', nameEn: 'Hungary', region: '南欧' },
  { code: '499', name: '黑山', nameEn: 'Montenegro', region: '南欧' },
  { code: '688', name: '塞尔维亚', nameEn: 'Serbia', region: '南欧' },
  { code: '705', name: '斯洛文尼亚', nameEn: 'Slovenia', region: '南欧' },
  { code: '807', name: '北马其顿', nameEn: 'North Macedonia', region: '南欧' },

  // 北美洲
  { code: '842', name: '美国', nameEn: 'United States', region: '北美洲' },
  { code: '124', name: '加拿大', nameEn: 'Canada', region: '北美洲' },
  { code: '304', name: '格陵兰', nameEn: 'Greenland', region: '北美洲' },
  { code: '666', name: '圣皮埃尔和密克隆', nameEn: 'Saint Pierre and Miquelon', region: '北美洲' },

  // 中美洲
  { code: '484', name: '墨西哥', nameEn: 'Mexico', region: '中美洲' },
  { code: '084', name: '伯利兹', nameEn: 'Belize', region: '中美洲' },
  { code: '188', name: '哥斯达黎加', nameEn: 'Costa Rica', region: '中美洲' },
  { code: '222', name: '萨尔瓦多', nameEn: 'El Salvador', region: '中美洲' },
  { code: '320', name: '危地马拉', nameEn: 'Guatemala', region: '中美洲' },
  { code: '340', name: '洪都拉斯', nameEn: 'Honduras', region: '中美洲' },
  { code: '558', name: '尼加拉瓜', nameEn: 'Nicaragua', region: '中美洲' },
  { code: '591', name: '巴拿马', nameEn: 'Panama', region: '中美洲' },

  // 南美洲
  { code: '076', name: '巴西', nameEn: 'Brazil', region: '南美洲' },
  { code: '032', name: '阿根廷', nameEn: 'Argentina', region: '南美洲' },
  { code: '152', name: '智利', nameEn: 'Chile', region: '南美洲' },
  { code: '170', name: '哥伦比亚', nameEn: 'Colombia', region: '南美洲' },
  { code: '218', name: '厄瓜多尔', nameEn: 'Ecuador', region: '南美洲' },
  { code: '254', name: '法属圭亚那', nameEn: 'French Guiana', region: '南美洲' },
  { code: '328', name: '圭亚那', nameEn: 'Guyana', region: '南美洲' },
  { code: '600', name: '巴拉圭', nameEn: 'Paraguay', region: '南美洲' },
  { code: '604', name: '秘鲁', nameEn: 'Peru', region: '南美洲' },
  { code: '740', name: '苏里南', nameEn: 'Suriname', region: '南美洲' },
  { code: '858', name: '乌拉圭', nameEn: 'Uruguay', region: '南美洲' },
  { code: '862', name: '委内瑞拉', nameEn: 'Venezuela', region: '南美洲' },
  { code: '238', name: '福克兰群岛', nameEn: 'Falkland Islands', region: '南美洲' },

  // 加勒比海
  { code: '028', name: '安提瓜和巴布达', nameEn: 'Antigua and Barbuda', region: '加勒比' },
  { code: '044', name: '巴哈马', nameEn: 'Bahamas', region: '加勒比' },
  { code: '052', name: '巴巴多斯', nameEn: 'Barbados', region: '加勒比' },
  { code: '092', name: '英属维尔京群岛', nameEn: 'British Virgin Islands', region: '加勒比' },
  { code: '136', name: '开曼群岛', nameEn: 'Cayman Islands', region: '加勒比' },
  { code: '192', name: '古巴', nameEn: 'Cuba', region: '加勒比' },
  { code: '212', name: '多米尼克', nameEn: 'Dominica', region: '加勒比' },
  { code: '214', name: '多米尼加', nameEn: 'Dominican Republic', region: '加勒比' },
  { code: '308', name: '格林纳达', nameEn: 'Grenada', region: '加勒比' },
  { code: '312', name: '瓜德罗普', nameEn: 'Guadeloupe', region: '加勒比' },
  { code: '332', name: '海地', nameEn: 'Haiti', region: '加勒比' },
  { code: '388', name: '牙买加', nameEn: 'Jamaica', region: '加勒比' },
  { code: '474', name: '马提尼克', nameEn: 'Martinique', region: '加勒比' },
  { code: '500', name: '蒙特塞拉特', nameEn: 'Montserrat', region: '加勒比' },
  { code: '531', name: '库拉索', nameEn: 'Curaçao', region: '加勒比' },
  { code: '533', name: '阿鲁巴', nameEn: 'Aruba', region: '加勒比' },
  { code: '630', name: '波多黎各', nameEn: 'Puerto Rico', region: '加勒比' },
  { code: '652', name: '圣巴泰勒米', nameEn: 'Saint Barthélemy', region: '加勒比' },
  { code: '659', name: '圣基茨和尼维斯', nameEn: 'Saint Kitts and Nevis', region: '加勒比' },
  { code: '662', name: '圣卢西亚', nameEn: 'Saint Lucia', region: '加勒比' },
  { code: '663', name: '法属圣马丁', nameEn: 'Saint Martin', region: '加勒比' },
  { code: '670', name: '圣文森特和格林纳丁斯', nameEn: 'Saint Vincent and the Grenadines', region: '加勒比' },
  { code: '780', name: '特立尼达和多巴哥', nameEn: 'Trinidad and Tobago', region: '加勒比' },
  { code: '796', name: '特克斯和凯科斯群岛', nameEn: 'Turks and Caicos Islands', region: '加勒比' },
  { code: '850', name: '美属维尔京群岛', nameEn: 'US Virgin Islands', region: '加勒比' },

  // 非洲 - 北非
  { code: '012', name: '阿尔及利亚', nameEn: 'Algeria', region: '北非' },
  { code: '434', name: '利比亚', nameEn: 'Libya', region: '北非' },
  { code: '504', name: '摩洛哥', nameEn: 'Morocco', region: '北非' },
  { code: '729', name: '苏丹', nameEn: 'Sudan', region: '北非' },
  { code: '788', name: '突尼斯', nameEn: 'Tunisia', region: '北非' },
  { code: '732', name: '西撒哈拉', nameEn: 'Western Sahara', region: '北非' },

  // 非洲 - 西非
  { code: '204', name: '贝宁', nameEn: 'Benin', region: '西非' },
  { code: '854', name: '布基纳法索', nameEn: 'Burkina Faso', region: '西非' },
  { code: '132', name: '佛得角', nameEn: 'Cape Verde', region: '西非' },
  { code: '384', name: '科特迪瓦', nameEn: "Côte d'Ivoire", region: '西非' },
  { code: '270', name: '冈比亚', nameEn: 'Gambia', region: '西非' },
  { code: '288', name: '加纳', nameEn: 'Ghana', region: '西非' },
  { code: '324', name: '几内亚', nameEn: 'Guinea', region: '西非' },
  { code: '624', name: '几内亚比绍', nameEn: 'Guinea-Bissau', region: '西非' },
  { code: '430', name: '利比里亚', nameEn: 'Liberia', region: '西非' },
  { code: '466', name: '马里', nameEn: 'Mali', region: '西非' },
  { code: '478', name: '毛里塔尼亚', nameEn: 'Mauritania', region: '西非' },
  { code: '562', name: '尼日尔', nameEn: 'Niger', region: '西非' },
  { code: '566', name: '尼日利亚', nameEn: 'Nigeria', region: '西非' },
  { code: '654', name: '圣赫勒拿', nameEn: 'Saint Helena', region: '西非' },
  { code: '686', name: '塞内加尔', nameEn: 'Senegal', region: '西非' },
  { code: '694', name: '塞拉利昂', nameEn: 'Sierra Leone', region: '西非' },
  { code: '768', name: '多哥', nameEn: 'Togo', region: '西非' },

  // 非洲 - 中非
  { code: '024', name: '安哥拉', nameEn: 'Angola', region: '中非' },
  { code: '120', name: '喀麦隆', nameEn: 'Cameroon', region: '中非' },
  { code: '140', name: '中非共和国', nameEn: 'Central African Republic', region: '中非' },
  { code: '148', name: '乍得', nameEn: 'Chad', region: '中非' },
  { code: '178', name: '刚果(布)', nameEn: 'Congo', region: '中非' },
  { code: '180', name: '刚果(金)', nameEn: 'DR Congo', region: '中非' },
  { code: '226', name: '赤道几内亚', nameEn: 'Equatorial Guinea', region: '中非' },
  { code: '266', name: '加蓬', nameEn: 'Gabon', region: '中非' },
  { code: '678', name: '圣多美和普林西比', nameEn: 'São Tomé and Príncipe', region: '中非' },

  // 非洲 - 东非
  { code: '108', name: '布隆迪', nameEn: 'Burundi', region: '东非' },
  { code: '232', name: '厄立特里亚', nameEn: 'Eritrea', region: '东非' },
  { code: '231', name: '埃塞俄比亚', nameEn: 'Ethiopia', region: '东非' },
  { code: '262', name: '吉布提', nameEn: 'Djibouti', region: '东非' },
  { code: '404', name: '肯尼亚', nameEn: 'Kenya', region: '东非' },
  { code: '450', name: '马达加斯加', nameEn: 'Madagascar', region: '东非' },
  { code: '454', name: '马拉维', nameEn: 'Malawi', region: '东非' },
  { code: '480', name: '毛里求斯', nameEn: 'Mauritius', region: '东非' },
  { code: '175', name: '马约特', nameEn: 'Mayotte', region: '东非' },
  { code: '508', name: '莫桑比克', nameEn: 'Mozambique', region: '东非' },
  { code: '638', name: '留尼汪', nameEn: 'Réunion', region: '东非' },
  { code: '646', name: '卢旺达', nameEn: 'Rwanda', region: '东非' },
  { code: '690', name: '塞舌尔', nameEn: 'Seychelles', region: '东非' },
  { code: '706', name: '索马里', nameEn: 'Somalia', region: '东非' },
  { code: '728', name: '南苏丹', nameEn: 'South Sudan', region: '东非' },
  { code: '800', name: '乌干达', nameEn: 'Uganda', region: '东非' },
  { code: '834', name: '坦桑尼亚', nameEn: 'Tanzania', region: '东非' },
  { code: '174', name: '科摩罗', nameEn: 'Comoros', region: '东非' },
  { code: '894', name: '赞比亚', nameEn: 'Zambia', region: '东非' },

  // 非洲 - 南非
  { code: '072', name: '博茨瓦纳', nameEn: 'Botswana', region: '南非' },
  { code: '426', name: '莱索托', nameEn: 'Lesotho', region: '南非' },
  { code: '516', name: '纳米比亚', nameEn: 'Namibia', region: '南非' },
  { code: '710', name: '南非', nameEn: 'South Africa', region: '南非' },
  { code: '748', name: '斯威士兰', nameEn: 'Eswatini', region: '南非' },
  { code: '890', name: '津巴布韦', nameEn: 'Zimbabwe', region: '南非' },

  // 大洋洲
  { code: '036', name: '澳大利亚', nameEn: 'Australia', region: '大洋洲' },
  { code: '554', name: '新西兰', nameEn: 'New Zealand', region: '大洋洲' },
  { code: '242', name: '斐济', nameEn: 'Fiji', region: '大洋洲' },
  { code: '296', name: '基里巴斯', nameEn: 'Kiribati', region: '大洋洲' },
  { code: '316', name: '关岛', nameEn: 'Guam', region: '大洋洲' },
  { code: '520', name: '瑙鲁', nameEn: 'Nauru', region: '大洋洲' },
  { code: '540', name: '新喀里多尼亚', nameEn: 'New Caledonia', region: '大洋洲' },
  { code: '574', name: '诺福克岛', nameEn: 'Norfolk Island', region: '大洋洲' },
  { code: '583', name: '密克罗尼西亚', nameEn: 'Micronesia', region: '大洋洲' },
  { code: '584', name: '马绍尔群岛', nameEn: 'Marshall Islands', region: '大洋洲' },
  { code: '585', name: '帕劳', nameEn: 'Palau', region: '大洋洲' },
  { code: '598', name: '巴布亚新几内亚', nameEn: 'Papua New Guinea', region: '大洋洲' },
  { code: '882', name: '萨摩亚', nameEn: 'Samoa', region: '大洋洲' },
  { code: '090', name: '所罗门群岛', nameEn: 'Solomon Islands', region: '大洋洲' },
  { code: '798', name: '图瓦卢', nameEn: 'Tuvalu', region: '大洋洲' },
  { code: '548', name: '瓦努阿图', nameEn: 'Vanuatu', region: '大洋洲' },
  { code: '060', name: '圣诞岛', nameEn: 'Christmas Island', region: '大洋洲' },
  { code: '166', name: '科科斯群岛', nameEn: 'Cocos Islands', region: '大洋洲' },
  { code: '184', name: '库克群岛', nameEn: 'Cook Islands', region: '大洋洲' },
  { code: '258', name: '法属波利尼西亚', nameEn: 'French Polynesia', region: '大洋洲' },
  { code: '260', name: '法属南部领地', nameEn: 'French Southern Territories', region: '大洋洲' },
  { code: '472', name: '马里亚纳群岛', nameEn: 'Northern Mariana Islands', region: '大洋洲' },
  { code: '570', name: '纽埃', nameEn: 'Niue', region: '大洋洲' },
  { code: '612', name: '皮特凯恩群岛', nameEn: 'Pitcairn Islands', region: '大洋洲' },
  { code: '772', name: '托克劳', nameEn: 'Tokelau', region: '大洋洲' },
  { code: '876', name: '瓦利斯和富图纳', nameEn: 'Wallis and Futuna', region: '大洋洲' },

  // 特殊代码
  { code: '000', name: '全球合计', nameEn: 'World', region: '特殊' },
  { code: '899', name: '其他地区', nameEn: 'Other Areas', region: '特殊' },
  { code: '900', name: '其他非洲', nameEn: 'Other Africa', region: '特殊' },
  { code: '901', name: '其他亚洲', nameEn: 'Other Asia', region: '特殊' },
  { code: '902', name: '其他欧洲', nameEn: 'Other Europe', region: '特殊' },
  { code: '903', name: '其他大洋洲', nameEn: 'Other Oceania', region: '特殊' },
  { code: '904', name: '其他美洲', nameEn: 'Other Americas', region: '特殊' },
  { code: '905', name: '其他中东', nameEn: 'Other Middle East', region: '特殊' },
  { code: '490', name: '其他亚洲地区', nameEn: 'Other Asia nes', region: '特殊' },
  { code: '699', name: '未列明国家', nameEn: 'Areas nes', region: '特殊' },
];

/**
 * 按地区分组的国家列表
 */
export const COUNTRIES_BY_REGION: Record<string, Country[]> = REPORTER_COUNTRIES.reduce((acc, country) => {
  const region = country.region;
  if (!acc[region]) {
    acc[region] = [];
  }
  acc[region].push(country);
  return acc;
}, {} as Record<string, Country[]>);

/**
 * 获取国家名称
 * 支持带前导零和不带前导零的代码
 */
export function getCountryName(code: string, locale: 'zh' | 'en' = 'zh'): string {
  // 先尝试精确匹配
  let country = REPORTER_COUNTRIES.find(c => c.code === code);
  
  // 如果没找到，尝试添加前导零匹配
  if (!country && code.length < 3) {
    const paddedCode = code.padStart(3, '0');
    country = REPORTER_COUNTRIES.find(c => c.code === paddedCode);
  }
  
  if (!country) return code;
  return locale === 'zh' ? country.name : country.nameEn;
}

/**
 * 获取地区列表
 */
export const REGIONS = [...new Set(REPORTER_COUNTRIES.map(c => c.region))];

/**
 * 常用贸易国家（快捷选择）
 */
export const COMMON_COUNTRIES = REPORTER_COUNTRIES.filter(c => 
  ['156', '842', '276', '392', '410', '826', '250', '380', '724', '528', '036', '124', '076', '356', '702', '764', '458', '360', '784', '643'].includes(c.code)
);

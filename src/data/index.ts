/**
 * 静态数据
 */

// country-codes 导出
export {
  REPORTER_COUNTRIES,
  COUNTRIES_BY_REGION,
  getCountryName,
  REGIONS,
  COMMON_COUNTRIES,
  type Country as TradeCountry,
} from './country-codes';

// locationData 导出
export {
  countries,
  getProvinces,
  getCities,
  findCountryByName,
  findProvinceByName,
  type Country as LocationCountry,
  type Province,
  type City,
} from './locationData';

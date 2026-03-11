'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X, Check, Loader2, Map as MapIcon, Navigation, Edit2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 地址组件接口
export interface AddressData {
  formatted: string;      // 完整格式化地址
  country: string;        // 国家
  countryCode: string;    // 国家代码
  state: string;          // 省/州
  city: string;           // 城市
  district: string;       // 区/县
  street: string;         // 街道
  postcode: string;       // 邮编
  lat: number;            // 纬度
  lng: number;            // 经度
}

interface AddressPickerProps {
  value?: AddressData | null;
  onChange: (address: AddressData) => void;
  placeholder?: string;
  disabled?: boolean;
  locale?: string; // 当前语言，如 'zh', 'en', 'ja' 等
}

// Nominatim 搜索结果类型
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country?: string;
    country_code?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    suburb?: string;
    road?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
}

// 反向地理编码结果
interface ReverseGeocodeResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country?: string;
    country_code?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    suburb?: string;
    road?: string;
    postcode?: string;
    [key: string]: string | undefined;
  };
}

// 搜索结果项组件
function SearchResultItem({ 
  result, 
  onClick,
  isSelected
}: { 
  result: NominatimResult; 
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 line-clamp-2">{result.display_name}</p>
        </div>
        {isSelected && <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />}
      </div>
    </button>
  );
}

export default function AddressPicker({ 
  value, 
  onChange, 
  placeholder = '搜索地址或在地图上选择...',
  disabled = false,
  locale = 'en'
}: AddressPickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [tempAddress, setTempAddress] = useState<AddressData | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isMapInitializedRef = useRef(false);

  // 语言映射：项目语言代码 -> Nominatim accept-language
  const getAcceptLanguage = useCallback(() => {
    const languageMap: Record<string, string> = {
      'zh': 'zh-CN,zh',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'de': 'de',
      'fr': 'fr',
      'es': 'es',
      'pt': 'pt',
      'ru': 'ru',
      'ar': 'ar',
    };
    return languageMap[locale] || 'en';
  }, [locale]);

  // 初始化地图
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isPickerOpen && mapContainerRef.current && !isMapInitializedRef.current) {
      // 延迟初始化，确保 DOM 已渲染
      const timer = setTimeout(() => {
        if (!mapContainerRef.current || isMapInitializedRef.current) return;
        
        try {
          // 默认位置：北京
          const defaultLat = value?.lat || 39.9042;
          const defaultLng = value?.lng || 116.4074;
          
          const map = L.map(mapContainerRef.current, {
            center: [defaultLat, defaultLng],
            zoom: value?.lat ? 13 : 4,
            zoomControl: true,
            attributionControl: false,
          });

          // 添加 OpenStreetMap 图层
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // 点击地图事件
          map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
            const { lat, lng } = e.latlng;
            setSelectedLocation({ lat, lng });
            
            // 更新标记
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = L.marker([lat, lng]).addTo(map);
            }
            
            // 反向地理编码
            await reverseGeocode(lat, lng);
          });

          mapRef.current = map;
          isMapInitializedRef.current = true;

          // 如果已有位置，添加标记
          if (value?.lat && value?.lng && value.lat !== 0 && value.lng !== 0) {
            markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
            map.setView([value.lat, value.lng], 13);
          }
          
          // 强制地图重绘
          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        } catch (error) {
          console.error('Map initialization error:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isPickerOpen, value?.lat, value?.lng]);

  // 当弹窗打开时，强制地图重绘
  useEffect(() => {
    if (isPickerOpen && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isPickerOpen]);

  // 清理地图
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        isMapInitializedRef.current = false;
      }
    };
  }, []);

  // 搜索地址
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const acceptLanguage = getAcceptLanguage();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          'accept-language': acceptLanguage,
        })
      );
      
      const results: NominatimResult[] = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [getAcceptLanguage]);

  // 反向地理编码
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const acceptLanguage = getAcceptLanguage();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` + 
        new URLSearchParams({
          lat: lat.toString(),
          lon: lng.toString(),
          format: 'json',
          addressdetails: '1',
          'accept-language': acceptLanguage,
        })
      );
      
      const result: ReverseGeocodeResult = await response.json();
      
      if (result && result.display_name) {
        const addr = result.address || {};
        const addressData: AddressData = {
          formatted: result.display_name,
          country: addr.country || '',
          countryCode: addr.country_code?.toUpperCase() || '',
          state: addr.state || addr.county || '',
          city: addr.city || addr.town || addr.village || '',
          district: addr.suburb || '',
          street: addr.road || '',
          postcode: addr.postcode || '',
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
        setTempAddress(addressData);
        setSearchResults([]); // 清空搜索结果
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // 防抖搜索
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchAddress]);

  // 解析地址
  const parseAddress = (result: NominatimResult): AddressData => {
    const addr = result.address || {};
    return {
      formatted: result.display_name,
      country: addr.country || '',
      countryCode: addr.country_code?.toUpperCase() || '',
      state: addr.state || addr.county || '',
      city: addr.city || addr.town || addr.village || '',
      district: addr.suburb || '',
      street: addr.road || '',
      postcode: addr.postcode || '',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  };

  // 选择搜索结果
  const handleSelectSearchResult = (result: NominatimResult) => {
    const address = parseAddress(result);
    setTempAddress(address);
    setSelectedLocation({ lat: address.lat, lng: address.lng });
    
    // 更新地图
    if (mapRef.current) {
      mapRef.current.setView([address.lat, address.lng], 13);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([address.lat, address.lng]);
      } else {
        markerRef.current = L.marker([address.lat, address.lng]).addTo(mapRef.current);
      }
    }
    
    setSearchQuery('');
    setSearchResults([]);
  };

  // 定位到当前位置
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持定位功能');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setSelectedLocation({ lat, lng });
        
        const leafletLib = L;
        if (mapRef.current && leafletLib) {
          mapRef.current.setView([lat, lng], 15);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = leafletLib.marker([lat, lng]).addTo(mapRef.current);
          }
        }
        
        reverseGeocode(lat, lng);
      },
      (error) => {
        // 根据错误类型给出友好提示
        const errorMessages: Record<number, string> = {
          1: '您拒绝了定位权限，请在浏览器设置中允许定位，或手动搜索地址',
          2: '无法获取位置信息，请手动搜索或在地图上选择',
          3: '定位请求超时，请手动搜索或在地图上选择',
        };
        const message = errorMessages[error.code] || '定位失败，请手动搜索或在地图上选择';
        console.warn('Geolocation failed:', error.code, error.message);
        alert(message);
      },
      { 
        enableHighAccuracy: false, // 关闭高精度，提高成功率
        timeout: 10000, // 10秒超时
        maximumAge: 300000 // 缓存5分钟
      }
    );
  };

  // 打开选择器
  const openPicker = () => {
    setIsPickerOpen(true);
    setTempAddress(value || null);
    if (value?.lat && value?.lng) {
      setSelectedLocation({ lat: value.lat, lng: value.lng });
    }
  };

  // 确认选择
  const handleConfirm = () => {
    if (tempAddress && tempAddress.formatted) {
      onChange(tempAddress);
    }
    setIsPickerOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // 销毁地图实例
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      isMapInitializedRef.current = false;
    }
  };

  // 取消选择
  const handleCancel = () => {
    setIsPickerOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setTempAddress(null);
    
    // 销毁地图实例，下次打开时会重新初始化
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      isMapInitializedRef.current = false;
    }
  };

  // 格式化显示地址
  const displayAddress = value?.formatted ? 
    [value.country, value.state, value.city, value.district, value.street].filter(Boolean).join(' / ') || 
    value.formatted.split(',').slice(0, 3).join(', ') : '';

  return (
    <div className="relative">
      {/* 地址显示区域 */}
      {!displayAddress ? (
        // 未设置地址：显示选择按钮
        <button
          onClick={disabled ? undefined : openPicker}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
            disabled 
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
              : 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
          }`}
        >
          <MapPin className="h-5 w-5" />
          <span className="font-medium">选择地址</span>
        </button>
      ) : (
        // 已设置地址：显示地址 + 修改按钮
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
            <MapPin className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-900 truncate">{displayAddress}</span>
          </div>
          {!disabled && (
            <button
              onClick={openPicker}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="修改地址"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* 地址选择器弹窗 */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col m-4">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">选择地址</h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 搜索区域 */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索国家、城市、街道..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                  )}
                </div>
                <button
                  onClick={handleLocateMe}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                  title="定位到当前位置"
                >
                  <Navigation className="h-5 w-5" />
                  <span className="hidden sm:inline">定位</span>
                </button>
              </div>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                  {searchResults.map((result) => (
                    <SearchResultItem
                      key={result.place_id}
                      result={result}
                      onClick={() => handleSelectSearchResult(result)}
                      isSelected={
                        tempAddress?.lat === parseFloat(result.lat) && 
                        tempAddress?.lng === parseFloat(result.lon)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 地图区域 */}
            <div className="relative flex-1 bg-gray-100" style={{ minHeight: '300px' }}>
              <div 
                ref={mapContainerRef} 
                className="absolute inset-0 w-full h-full"
              />
              
              {/* 地图提示 */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md z-10">
                <p className="text-sm text-gray-600">
                  💡 点击地图选择位置，或使用上方搜索框搜索地址
                </p>
              </div>
              
              {/* 加载提示 */}
              {isReverseGeocoding && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-gray-700">正在获取地址...</span>
                </div>
              )}
            </div>

            {/* 当前选中的地址 */}
            {tempAddress && tempAddress.formatted && (
              <div className="p-4 border-t border-gray-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {[tempAddress.country, tempAddress.state, tempAddress.city, tempAddress.district, tempAddress.street].filter(Boolean).join(' / ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{tempAddress.formatted}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!tempAddress?.formatted}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

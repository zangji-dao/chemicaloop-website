'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import PageBanner from '@/components/layout/PageBanner';
import { Newspaper, Filter, TrendingUp, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  summary: string;
  summaryEn: string;
  source: string;
  url?: string;
  imageUrl?: string;
  publishedAt: string;
}

export default function NewsPage() {
  const t = useTranslations('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MARKET' | 'TRADE' | 'TECHNOLOGY' | 'COMPANY' | 'REGULATION'>('ALL');

  useEffect(() => {
    fetchNews();
  }, [categoryFilter]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Global Chemical Market Shows Strong Growth',
          titleEn: 'Global Chemical Market Shows Strong Growth',
          category: 'MARKET',
          summary: 'The global chemical market continues to expand with strong demand from emerging economies.',
          summaryEn: 'The global chemical market continues to expand with strong demand from emerging economies.',
          source: 'Chemical Weekly',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80',
          publishedAt: '2024-02-08T10:00:00Z'
        },
        {
          id: '2',
          title: 'New Trade Regulations Impact Chemical Exports',
          titleEn: 'New Trade Regulations Impact Chemical Exports',
          category: 'REGULATION',
          summary: 'Recent regulatory changes affect chemical export procedures across major markets.',
          summaryEn: 'Recent regulatory changes affect chemical export procedures across major markets.',
          source: 'Trade News',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80',
          publishedAt: '2024-02-07T14:30:00Z'
        },
        {
          id: '3',
          title: 'Innovative Green Chemistry Technology Breakthrough',
          titleEn: 'Innovative Green Chemistry Technology Breakthrough',
          category: 'TECHNOLOGY',
          summary: 'Researchers develop new sustainable chemical processes with reduced environmental impact.',
          summaryEn: 'Researchers develop new sustainable chemical processes with reduced environmental impact.',
          source: 'Science Daily',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
          publishedAt: '2024-02-06T09:15:00Z'
        },
        {
          id: '4',
          title: 'Major Chemical Company Announces Strategic Partnership',
          titleEn: 'Major Chemical Company Announces Strategic Partnership',
          category: 'COMPANY',
          summary: 'Leading chemical manufacturer forms alliance to expand production capabilities.',
          summaryEn: 'Leading chemical manufacturer forms alliance to expand production capabilities.',
          source: 'Business Wire',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&q=80',
          publishedAt: '2024-02-05T16:45:00Z'
        },
        {
          id: '5',
          title: 'Chemical Trade Volumes Hit Record High in Q1',
          titleEn: 'Chemical Trade Volumes Hit Record High in Q1',
          category: 'TRADE',
          summary: 'International chemical trade reaches unprecedented levels driven by industrial demand.',
          summaryEn: 'International chemical trade reaches unprecedented levels driven by industrial demand.',
          source: 'Market Watch',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1563218126-a527ad04aa18?w=600&q=80',
          publishedAt: '2024-02-04T11:20:00Z'
        },
        {
          id: '6',
          title: 'Sustainable Packaging Materials Drive New Market Demand',
          titleEn: 'Sustainable Packaging Materials Drive New Market Demand',
          category: 'MARKET',
          summary: 'Growing environmental concerns boost demand for eco-friendly chemical packaging solutions.',
          summaryEn: 'Growing environmental concerns boost demand for eco-friendly chemical packaging solutions.',
          source: 'Green Tech News',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&q=80',
          publishedAt: '2024-02-03T08:00:00Z'
        },
        {
          id: '7',
          title: 'New Safety Standards for Chemical Storage Implemented',
          titleEn: 'New Safety Standards for Chemical Storage Implemented',
          category: 'REGULATION',
          summary: 'Global safety authorities release updated guidelines for chemical storage facilities.',
          summaryEn: 'Global safety authorities release updated guidelines for chemical storage facilities.',
          source: 'Safety First',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=600&q=80',
          publishedAt: '2024-02-02T13:10:00Z'
        },
        {
          id: '8',
          title: 'Advanced Polymer Technology Revolutionizes Industry',
          titleEn: 'Advanced Polymer Technology Revolutionizes Industry',
          category: 'TECHNOLOGY',
          summary: 'New polymer compounds offer superior performance for industrial applications.',
          summaryEn: 'New polymer compounds offer superior performance for industrial applications.',
          source: 'Tech Innovation',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=600&q=80',
          publishedAt: '2024-02-01T15:30:00Z'
        },
        {
          id: '9',
          title: 'Chemical Manufacturing Sector Shows Recovery Signs',
          titleEn: 'Chemical Manufacturing Sector Shows Recovery Signs',
          category: 'COMPANY',
          summary: 'Industry reports indicate strong performance in chemical production across regions.',
          summaryEn: 'Industry reports indicate strong performance in chemical production across regions.',
          source: 'Industrial Report',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80',
          publishedAt: '2024-01-31T10:45:00Z'
        },
        {
          id: '10',
          title: 'Trade Agreement Opens New Markets for Chemical Products',
          titleEn: 'Trade Agreement Opens New Markets for Chemical Products',
          category: 'TRADE',
          summary: 'Bilateral trade agreements create opportunities for chemical exporters.',
          summaryEn: 'Bilateral trade agreements create opportunities for chemical exporters.',
          source: 'Trade Times',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
          publishedAt: '2024-01-30T12:00:00Z'
        },
        {
          id: '11',
          title: 'Bio-Based Chemicals Gain Market Share',
          titleEn: 'Bio-Based Chemicals Gain Market Share',
          category: 'MARKET',
          summary: 'Renewable chemical products see increased adoption across various industries.',
          summaryEn: 'Renewable chemical products see increased adoption across various industries.',
          source: 'Bio Chemistry',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&q=80',
          publishedAt: '2024-01-29T09:30:00Z'
        },
        {
          id: '12',
          title: 'Environmental Regulations Shape Future Chemical Production',
          titleEn: 'Environmental Regulations Shape Future Chemical Production',
          category: 'REGULATION',
          summary: 'Stricter environmental policies drive innovation in chemical manufacturing processes.',
          summaryEn: 'Stricter environmental policies drive innovation in chemical manufacturing processes.',
          source: 'Environment News',
          url: '#',
          imageUrl: 'https://images.unsplash.com/photo-1470219556762-1771e77f4ce6?w=600&q=80',
          publishedAt: '2024-01-28T14:15:00Z'
        }
      ];

      // 根据分类过滤
      const filteredNews = categoryFilter === 'ALL'
        ? mockNews
        : mockNews.filter(item => item.category === categoryFilter);

      setNews(filteredNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MARKET': return 'bg-blue-100 text-blue-700';
      case 'TRADE': return 'bg-green-100 text-green-700';
      case 'TECHNOLOGY': return 'bg-purple-100 text-purple-700';
      case 'COMPANY': return 'bg-yellow-100 text-yellow-700';
      case 'REGULATION': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MARKET': return <TrendingUp className="h-4 w-4" />;
      case 'TRADE': return <Newspaper className="h-4 w-4" />;
      case 'TECHNOLOGY': return <RefreshCw className="h-4 w-4" />;
      case 'COMPANY': return <TrendingUp className="h-4 w-4" />;
      case 'REGULATION': return <Newspaper className="h-4 w-4" />;
      default: return <Newspaper className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page Banner */}
      <PageBanner
        title="Latest Chemical Industry News"
        subtitle="Stay updated with the latest market trends, trade updates, technology innovations, and regulatory changes"
        backgroundImage="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80"
      />

      <main className="flex-1 pb-responsive px-responsive">
        <div className="container-responsive mx-auto pt-responsive">

        {/* 过滤器 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8 sticky top-24 z-10">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-small font-medium text-gray-700 flex-shrink-0">Filter by:</span>
              {(['ALL', 'MARKET', 'TRADE', 'TECHNOLOGY', 'COMPANY', 'REGULATION'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-small font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All' : cat}
                </button>
              ))}
            </div>

            <span className="text-small text-gray-500">
              {news.length} articles
            </span>
          </div>
        </div>

        {/* 瀑布流布局 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-h3 font-semibold text-gray-900 mb-responsive">No News Available</h3>
            <p className="text-body text-gray-500">News will be displayed here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
                style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}
              >
                {/* 图片区域 */}
                <div className="md:w-1/3 relative overflow-hidden">
                  <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center relative">
                    {/* 装饰背景 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-800/5"></div>

                    {/* 真实图片 */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.titleEn}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-10">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                              </pattern>
                            </defs>
                            <rect width="100" height="100" fill="url(#grid)" />
                          </svg>
                        </div>
                        <Newspaper className="w-12 h-12 text-blue-300" />
                      </>
                    )}

                    {/* 分类标签 */}
                    <span className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-small font-bold shadow-md ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                      <span className="ml-2">{item.category}</span>
                    </span>

                    {/* 日期标签 */}
                    <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-small font-medium text-gray-700 shadow-md flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="md:w-2/3 p-6 flex flex-col justify-center">
                  {/* 来源 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Newspaper className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-small font-medium text-gray-500 uppercase tracking-wider">{item.source}</span>
                  </div>

                  {/* 标题 */}
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-tight hover:text-blue-600 transition-colors cursor-pointer">
                    {item.titleEn}
                  </h3>

                  {/* 摘要 */}
                  <p className="text-body text-gray-600 mb-5 leading-relaxed line-clamp-3">
                    {item.summaryEn}
                  </p>

                  {/* 底部操作栏 */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="text-small text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {Math.floor(Math.random() * 5) + 2} min read
                      </span>
                    </div>
                    <a
                      href={item.url || '#'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-sm"
                    >
                      Read More
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

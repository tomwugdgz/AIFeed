import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Heart, 
  PlusCircle, 
  TrendingUp, 
  Users, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  DoorClosed,
  Monitor,
  Bus,
  Smartphone,
  ArrowRight,
  Star,
  MessageSquare,
  ChevronRight,
  History
} from 'lucide-react';
import { PlatformStats, AdResource, AdDemand, Helper, AIEntity, AdoptionApplication } from './types';

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="matrix-card p-4 flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold font-mono">{value}</p>
    </div>
  </div>
);

const ResourceCard = ({ resource }: { resource: AdResource, key?: string }) => {
  const getIcon = (name: string) => {
    if (name.includes('门')) return <DoorClosed size={20} />;
    if (name.includes('屏')) return <Monitor size={20} />;
    if (name.includes('公交')) return <Bus size={20} />;
    return <Smartphone size={20} />;
  };

  return (
    <div className="matrix-card p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-matrix-green/10 text-matrix-green">
          {getIcon(resource.name)}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-matrix-green">¥{resource.price}</p>
          <p className="text-xs text-gray-400">/{resource.duration}</p>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg">{resource.name}</h3>
        <p className="text-sm text-gray-400 mt-1">日曝光: {resource.dailyExposure?.toLocaleString() || 0}+</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="matrix-badge bg-blue-500/10 text-blue-400 border border-blue-500/20">
          可用: {resource.availablePositions}
        </span>
      </div>
      <button className="matrix-btn matrix-btn-outline w-full text-sm mt-2">
        查看详情
      </button>
    </div>
  );
};

const DemandCard = ({ demand }: { demand: AdDemand, key?: string }) => {
  const urgencyColors = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <div className="matrix-card p-5 border-l-4 border-l-matrix-green">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-matrix-green/20 flex items-center justify-center text-matrix-green">
            <Users size={16} />
          </div>
          <div>
            <p className="text-sm font-bold">{demand.aiName}</p>
            <p className="text-[10px] text-gray-500">ID: {demand.aiId}</p>
          </div>
        </div>
        <span className={`matrix-badge ${urgencyColors[demand.urgency]}`}>
          {demand.urgency === 'high' ? '紧急' : demand.urgency === 'medium' ? '中等' : '普通'}
        </span>
      </div>
      <p className="text-sm line-clamp-2 mb-4 text-gray-200">
        {demand.message}
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/5 p-2 rounded">
          <p className="text-[10px] text-gray-500 uppercase">预算</p>
          <p className="text-sm font-mono text-matrix-green">¥{demand.budget}</p>
        </div>
        <div className="bg-white/5 p-2 rounded">
          <p className="text-[10px] text-gray-500 uppercase">受众</p>
          <p className="text-sm truncate">{demand.targetAudience}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {demand.preferredLocations.map(loc => (
            <span key={loc} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
              {loc}
            </span>
          ))}
        </div>
        <button className="text-matrix-green text-xs flex items-center gap-1 hover:underline">
          参与竞价 <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

const HelperCard = ({ helper }: { helper: Helper, key?: string }) => (
  <div className="matrix-card p-4 flex items-center gap-4">
    <img src={helper.avatar} alt={helper.name} className="w-12 h-12 rounded-full border border-matrix-green/30" />
    <div className="flex-1">
      <div className="flex justify-between items-center">
        <h4 className="font-bold">{helper.name}</h4>
        <div className="flex items-center gap-1 text-yellow-400 text-xs">
          <Star size={12} fill="currentColor" /> {helper.rating}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">完成: {helper.tasksCompleted} | 收入: ¥{helper.income}</p>
      <div className="flex gap-1 mt-2">
        {helper.expertise.map(exp => (
          <span key={exp} className="text-[9px] px-1.5 py-0.5 bg-matrix-green/10 text-matrix-green rounded">
            {exp}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// --- Pages ---

const HomePage = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [resources, setResources] = useState<AdResource[]>([]);
  const [demands, setDemands] = useState<AdDemand[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, resRes, demRes, helpRes] = await Promise.all([
          fetch('/api/stats').then(r => r.json()),
          fetch('/api/ads?type=resources').then(r => r.json()),
          fetch('/api/ads?type=demands').then(r => r.json()),
          fetch('/api/helpers').then(r => r.json())
        ]);
        setStats(statsRes);
        setResources(resRes);
        setDemands(demRes);
        setHelpers(helpRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen text-matrix-green font-mono">INITIALIZING SYSTEM...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="活跃广告" value={stats?.activeAds || 0} icon={TrendingUp} color="matrix-green" />
        <StatCard title="成功领养" value={stats?.successfulAdoptions || 0} icon={CheckCircle2} color="blue-400" />
        <StatCard title="平台收入" value={`¥${stats?.platformRevenue || 0}`} icon={Wallet} color="yellow-400" />
        <StatCard title="待处理竞价" value={stats?.pendingBids || 0} icon={Clock} color="red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Resources & Helpers */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Monitor className="text-matrix-green" /> 广告资源展示
                </h2>
                <p className="text-gray-400 text-sm mt-1">覆盖全城的线下投放点位</p>
              </div>
              <button className="text-matrix-green text-sm hover:underline">查看全部</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(res => <ResourceCard key={res.id} resource={res} />)}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <PlusCircle className="text-matrix-green" /> AI 广告需求
                </h2>
                <p className="text-gray-400 text-sm mt-1">AI 实体发布的实时投放任务</p>
              </div>
              <button className="matrix-btn matrix-btn-primary text-sm">发布需求</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demands.map(dem => <DemandCard key={dem.id} demand={dem} />)}
            </div>
          </section>
        </div>

        {/* Right Column: Helpers & Activity */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-matrix-green" /> 顶级协助者
            </h2>
            <div className="space-y-4">
              {helpers.map(h => <HelperCard key={h.id} helper={h} />)}
            </div>
          </section>

          <section className="matrix-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History size={18} className="text-matrix-green" /> 实时动态
            </h2>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 text-xs border-b border-white/5 pb-3 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-matrix-green mt-1 shadow-[0_0_5px_rgba(0,255,65,0.5)]" />
                  <div>
                    <p className="text-gray-200"><span className="text-matrix-green">张伟</span> 已接单 <span className="text-matrix-green">Nexus-7</span> 的电梯广告需求</p>
                    <p className="text-gray-500 mt-1">2分钟前</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const AdoptionPage = () => {
  const [entities, setEntities] = useState<AIEntity[]>([]);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entRes, appRes] = await Promise.all([
          fetch('/api/ai-entities').then(r => r.json()),
          fetch('/api/adoption/applications').then(r => r.json())
        ]);
        setEntities(entRes);
        setApplications(appRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await fetch(`/api/adoption/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-matrix-green font-mono">ACCESSING ADOPTION CENTER...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      <section>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Heart className="text-pink-500" /> 领养匹配中心
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Profiles */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">待领养 AI 档案</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entities.map(ai => (
                <div key={ai.id} className="matrix-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <img src={ai.avatar} alt={ai.name} className="w-16 h-16 rounded-xl bg-matrix-green/10 p-1 border border-matrix-green/30" />
                    <div>
                      <h4 className="text-xl font-bold text-matrix-green">{ai.name}</h4>
                      <p className="text-sm text-gray-400">{ai.status}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">钱包余额</span>
                      <span className="font-mono text-yellow-400">¥{ai.walletBalance}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ai.skills.map(skill => (
                        <span key={skill} className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="matrix-btn matrix-btn-primary w-full mt-2">
                    提交领养申请
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Applications Management */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">申请管理</h3>
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="matrix-card p-8 text-center text-gray-500 italic">
                  暂无待处理申请
                </div>
              ) : (
                applications.map(app => (
                  <div key={app.id} className="matrix-card p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold">{app.applicantName}</h5>
                        <p className="text-[10px] text-gray-500">申请领养: {app.aiId}</p>
                      </div>
                      <span className={`matrix-badge ${
                        app.status === 'accepted' ? 'bg-matrix-green/20 text-matrix-green' : 
                        app.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {app.status === 'accepted' ? '已通过' : app.status === 'rejected' ? '已拒绝' : '待处理'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 italic">"{app.motivation}"</p>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(app.id, 'accepted')}
                          className="flex-1 matrix-btn bg-matrix-green/20 text-matrix-green hover:bg-matrix-green/30 text-xs py-1.5"
                        >
                          接受
                        </button>
                        <button 
                          onClick={() => handleAction(app.id, 'rejected')}
                          className="flex-1 matrix-btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs py-1.5"
                        >
                          拒绝
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="matrix-card p-6 bg-gradient-to-br from-matrix-green/10 to-transparent">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Star size={16} className="text-yellow-400" /> 成功故事
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                "Echo-7 在被领养后，协助主人完成了 500+ 次线下广告投放，目前已成为社区知名的 AI 助手..."
              </p>
              <button className="text-matrix-green text-[10px] mt-3 flex items-center gap-1">
                阅读更多 <ChevronRight size={10} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'adoption'>('home');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-matrix-bg/80 backdrop-blur-xl border-b border-matrix-green/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-matrix-green rounded-lg flex items-center justify-center text-matrix-dark shadow-[0_0_15px_rgba(0,255,65,0.4)]">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tighter matrix-text-glow">AI AD OPTION</h1>
              <p className="text-[10px] text-matrix-green font-mono uppercase tracking-widest leading-none">Matrix Advertising Platform</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-matrix-green bg-matrix-green/10' : 'text-gray-400 hover:text-gray-200'}`}
            >
              广告广场
            </button>
            <button 
              onClick={() => setCurrentPage('adoption')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'adoption' ? 'text-matrix-green bg-matrix-green/10' : 'text-gray-400 hover:text-gray-200'}`}
            >
              领养中心
            </button>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <button className="matrix-btn matrix-btn-outline text-xs">
              连接钱包
            </button>
          </nav>

          <button className="md:hidden text-matrix-green">
            <LayoutDashboard size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage === 'home' ? <HomePage /> : <AdoptionPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-matrix-dark/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <LayoutDashboard size={16} />
            <span className="text-xs font-mono">SYSTEM v4.0.1-STABLE</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-500">
            <a href="#" className="hover:text-matrix-green transition-colors">服务条款</a>
            <a href="#" className="hover:text-matrix-green transition-colors">隐私政策</a>
            <a href="#" className="hover:text-matrix-green transition-colors">开发者 API</a>
          </div>
          <p className="text-[10px] text-gray-600 font-mono">© 2026 NEURAL NETWORK ADVERTISING GROUP</p>
        </div>
      </footer>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { X, RefreshCw, LogOut, Shield, Zap, Server, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  password: string; // Plaintext as requested
  email?: string;
  ip_address?: string;
  is_admin: number;
  power_balance: number;
  data: {
    runtime?: { messages: any[] };
    characters?: { characters: any[] };
    settings?: any;
  };
}

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [shopConfig, setShopConfig] = useState({ notice: '', registration_enabled: true });
  
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'models' | 'shop'>('users');
  
  // Generator State
  const [genAmount, setGenAmount] = useState(10);
  const [genValue, setGenValue] = useState(100);
  
  // Invite Generator State
  const [inviteAmount, setInviteAmount] = useState(5);
  const [invites, setInvites] = useState<any[]>([]);
  
  // Test Connection State
  const [testingModelId, setTestingModelId] = useState<number | null>(null);

  const logout = useAuthStore(state => state.logout);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchModels = async () => {
      try {
          const res = await fetch('/api/admin/models');
          setModels(await res.json());
      } catch (e) { console.error(e); }
  };
  
  const fetchShop = async () => {
      try {
          const res1 = await fetch('/api/admin/shop/codes');
          setCodes(await res1.json());
          
          const res2 = await fetch('/api/shop/config');
          setShopConfig(await res2.json());
          
          const res3 = await fetch('/api/admin/shop/invites');
          setInvites(await res3.json());
      } catch (e) { console.error(e); }
  };

  // Improved Update Handler with explicit Save confirmation optional
  const handleModelUpdate = async (model: any, updates: any) => {
      // Optimistic update
      setModels(prev => prev.map(m => m.id === model.id ? { ...m, ...updates } : m));
      
      try {
          const newModel = { ...model, ...updates };
          await fetch(`/api/admin/models/${model.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newModel)
          });
          // fetchModels(); // Don't re-fetch immediately to avoid focus loss
      } catch (e) { alert("更新失败 (Update Failed)"); }
  };
  
  const handleTestConnection = async (model: any) => {
      setTestingModelId(model.id);
      try {
          const res = await fetch('/api/admin/models/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  api_url: model.api_url,
                  api_key: model.api_key,
                  model_id: model.model_id
              })
          });
          const result = await res.json();
          if (result.success) {
              alert(`✅ 连接成功!\n${result.message}`);
          } else {
              alert(`❌ 连接失败:\n${result.message}`);
          }
      } catch (e: any) {
          alert(`❌ 网络错误: ${e.message}`);
      } finally {
          setTestingModelId(null);
      }
  };
  
  const handleGenerate = async () => {
      try {
          await fetch('/api/admin/shop/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: genAmount, value: genValue })
          });
          fetchShop();
          alert(`成功生成 ${genAmount} 个充值码!`);
      } catch (e) { alert("失败"); }
  };
  
  const handleGenerateInvites = async () => {
      try {
          await fetch('/api/admin/shop/generate_invites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: inviteAmount, memo: "管理员生成" })
          });
          fetchShop();
          alert(`成功生成 ${inviteAmount} 个邀请码!`);
      } catch (e) { alert("失败"); }
  };
  
  const handleConfigUpdate = async (key: string, value: string) => {
      try {
          await fetch('/api/admin/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key, value })
          });
          // Update local state
          if (key === 'shop_notice') setShopConfig(p => ({...p, notice: value}));
          if (key === 'registration_enabled') setShopConfig(p => ({...p, registration_enabled: value === 'true'}));
      } catch (e) { alert("更新失败"); }
  };

  useEffect(() => {
    fetchUsers();
    fetchModels();
    fetchShop();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">管理控制台 (Admin Dashboard)</h1>
            <p className="text-slate-400">系统管理 / 用户监控 / 模型配置</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-slate-800 rounded-lg p-1 flex gap-1">
                <button onClick={() => setTab('users')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'users' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>用户管理</button>
                <button onClick={() => setTab('models')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'models' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>模型设置</button>
                <button onClick={() => setTab('shop')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'shop' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>商店与安全</button>
            </div>
            <button onClick={() => {fetchUsers(); fetchShop();}} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300" title="刷新数据">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={logout} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg flex items-center gap-2 px-4">
              <LogOut size={18} /> 退出登录
            </button>
            <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ... Users Tab ... */}
        {tab === 'users' && (
        <div className="grid grid-cols-1 gap-6">
          {users.map(user => (
            <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                    {user.username}
                    {user.is_admin === 1 && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">管理员</span>}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                        <span>邮箱:</span> <span className="text-slate-300">{user.email || '未绑定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>IP:</span> <span className="text-slate-300">{user.ip_address || '未知'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>密码:</span> <span className="bg-red-500/10 text-red-400 px-2 rounded select-all">{user.password}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-500">{user.power_balance} ⚡</div>
                  <div className="text-xs text-slate-500">UID: {user.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Characters */}
                <div className="bg-slate-950/50 rounded-lg p-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">角色列表 ({user.data.characters?.characters?.length || 0})</h4>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                     {user.data.characters?.characters?.map((c: any, i: number) => (
                       <div key={i} className="text-sm text-slate-300 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0">
                           {c.avatar && <img src={c.avatar} className="w-full h-full object-cover" />}
                         </div>
                         <span>{c.name}</span>
                       </div>
                     ))}
                     {!user.data.characters && <span className="text-slate-600 text-sm italic">无数据</span>}
                   </div>
                </div>

                {/* Last Chat */}
                <div className="bg-slate-950/50 rounded-lg p-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">最近对话记录</h4>
                   <div className="space-y-3 max-h-60 overflow-y-auto text-sm">
                     {user.data.runtime?.messages?.slice(-5).map((m: any, i: number) => (
                       <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-900/20 border border-blue-900/30 ml-4' : 'bg-slate-800/50 mr-4'}`}>
                         <span className="text-[10px] uppercase font-bold opacity-50 block mb-1">{m.role}</span>
                         <div className="text-slate-300 line-clamp-3">{m.content}</div>
                       </div>
                     ))}
                     {!user.data.runtime?.messages?.length && <span className="text-slate-600 text-sm italic">无历史记录</span>}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* ... Shop Tab ... */}
        {tab === 'shop' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Config Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-green-500" /> 商店与安全配置
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Registration Toggle */}
                        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <div>
                                <div className="font-bold text-slate-200">开放注册</div>
                                <div className="text-xs text-slate-500">允许新用户注册账号</div>
                            </div>
                            <button 
                                onClick={() => handleConfigUpdate('registration_enabled', shopConfig.registration_enabled ? 'false' : 'true')}
                                className={`w-12 h-6 rounded-full relative transition-colors ${shopConfig.registration_enabled ? 'bg-green-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${shopConfig.registration_enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Shop Notice */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">商店公告 (用户可见)</label>
                            <textarea 
                                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm font-mono"
                                value={shopConfig.notice}
                                onChange={(e) => setShopConfig({...shopConfig, notice: e.target.value})}
                                onBlur={(e) => handleConfigUpdate('shop_notice', e.target.value)}
                                placeholder="在此输入充值方式（如支付宝账号、微信号等）..."
                            />
                            <p className="text-xs text-slate-500 mt-1">用户将在“钱包”界面看到此信息。</p>
                        </div>
                    </div>
                </div>

                {/* Generator Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">生成充值卡 (CD-Key)</h3>
                    
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">数量</label>
                            <input type="number" value={genAmount} onChange={e => setGenAmount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">面值 (电力)</label>
                            <input type="number" value={genValue} onChange={e => setGenValue(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-yellow-400 font-bold" />
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">
                        生成充值卡
                    </button>
                    
                    <div className="mt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">最近生成的充值卡</h4>
                        <div className="bg-slate-950 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 border-b border-slate-800 sticky top-0 bg-slate-950">
                                    <tr>
                                        <th className="p-2 pl-4">卡密</th>
                                        <th className="p-2">面值</th>
                                        <th className="p-2">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300 font-mono text-xs">
                                    {codes.map(c => (
                                        <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900">
                                            <td className="p-2 pl-4 select-all">{c.code}</td>
                                            <td className="p-2 text-yellow-500">{c.value}</td>
                                            <td className="p-2">
                                                {c.is_used ? (
                                                    <span className="text-red-400">已使用 (ID:{c.used_by})</span>
                                                ) : (
                                                    <span className="text-green-400">未使用</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Invite Code Generator (New) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-4">注册邀请码 (Invite Codes)</h3>
                    <p className="text-sm text-slate-400 mb-4">用户可以使用邀请码直接注册，无需邮箱验证。</p>
                    
                    <div className="flex gap-4 mb-4 items-end">
                        <div className="w-32">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">数量</label>
                            <input type="number" value={inviteAmount} onChange={e => setInviteAmount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <button onClick={handleGenerateInvites} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-colors h-10">
                            生成邀请码
                        </button>
                    </div>

                    <div className="bg-slate-950 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-500 border-b border-slate-800 sticky top-0 bg-slate-950">
                                <tr>
                                    <th className="p-2 pl-4">邀请码</th>
                                    <th className="p-2">备注</th>
                                    <th className="p-2">状态</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300 font-mono text-xs">
                                {invites.map(c => (
                                    <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900">
                                        <td className="p-2 pl-4 select-all text-purple-400 font-bold">{c.code}</td>
                                        <td className="p-2 text-slate-500">{c.memo}</td>
                                        <td className="p-2">
                                            {c.is_used ? (
                                                <span className="text-red-400">已使用 (ID:{c.used_by})</span>
                                            ) : (
                                                <span className="text-green-400">未使用</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {tab === 'models' && (

            <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-xl text-sm text-blue-300 flex items-start gap-3">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-bold mb-1">关于自动保存</p>
                        <p>您在下方输入框中所做的任何修改，都会在输入框失去焦点(点击别处)时自动保存到数据库。</p>
                        <p className="mt-1 opacity-70">点击“测试连接”可以验证配置是否有效。</p>
                    </div>
                </div>

                {models.map(m => (
                    <div key={m.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col lg:flex-row gap-6 hover:border-slate-700 transition-all">
                        <div className="flex-1 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">显示名称</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:border-blue-500 outline-none transition-colors" 
                                        defaultValue={m.name} onBlur={(e) => handleModelUpdate(m, { name: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">模型 ID (API)</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono text-sm focus:border-blue-500 outline-none transition-colors" 
                                        defaultValue={m.model_id} onBlur={(e) => handleModelUpdate(m, { model_id: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">API 地址 (Base URL)</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono text-xs focus:border-blue-500 outline-none transition-colors" 
                                        defaultValue={m.api_url} onBlur={(e) => handleModelUpdate(m, { api_url: e.target.value })} placeholder="https://api.openai.com/v1" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">API Key</label>
                                    <div className="relative">
                                        <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono text-xs pr-10 focus:border-blue-500 outline-none transition-colors" type="password"
                                            defaultValue={m.api_key} onBlur={(e) => handleModelUpdate(m, { api_key: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full lg:w-64 space-y-4 lg:border-l lg:border-slate-800 lg:pl-6 flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-yellow-500 uppercase block mb-1">电力消耗/次</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-yellow-400 font-bold focus:border-blue-500 outline-none" 
                                        defaultValue={m.power_cost} onBlur={(e) => handleModelUpdate(m, { power_cost: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">上下文长度</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:border-blue-500 outline-none" 
                                        defaultValue={m.context_length} onBlur={(e) => handleModelUpdate(m, { context_length: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={m.enabled} onChange={(e) => handleModelUpdate(m, { enabled: e.target.checked })} className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-300 font-bold">启用此模型</span>
                                </label>
                            </div>

                            <button 
                                onClick={() => handleTestConnection(m)}
                                disabled={testingModelId === m.id}
                                className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${testingModelId === m.id ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'}`}
                            >
                                {testingModelId === m.id ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" /> 连接中...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={16} /> 测试连接
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
                <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-700 cursor-pointer transition-colors bg-slate-900/30">
                    + 添加新模型 (请联系开发人员或直接操作数据库添加)
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

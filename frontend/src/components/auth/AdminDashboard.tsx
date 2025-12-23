import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { X, RefreshCw, LogOut, Shield } from 'lucide-react';

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

  const handleModelUpdate = async (model: any, updates: any) => {
      try {
          const newModel = { ...model, ...updates };
          await fetch(`/api/admin/models/${model.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newModel)
          });
          fetchModels();
      } catch (e) { alert("Failed to update"); }
  };
  
  const handleGenerate = async () => {
      try {
          await fetch('/api/admin/shop/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: genAmount, value: genValue })
          });
          fetchShop();
          alert(`Generated ${genAmount} codes!`);
      } catch (e) { alert("Failed"); }
  };
  
  const handleGenerateInvites = async () => {
      try {
          await fetch('/api/admin/shop/generate_invites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: inviteAmount, memo: "Admin Generated" })
          });
          fetchShop();
          alert(`Generated ${inviteAmount} invite codes!`);
      } catch (e) { alert("Failed"); }
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
      } catch (e) { alert("Failed"); }
  };

  useEffect(() => {
    fetchUsers();
    fetchModels();
    fetchShop();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">System Management & Monitoring</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-slate-800 rounded-lg p-1 flex gap-1">
                <button onClick={() => setTab('users')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'users' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Users</button>
                <button onClick={() => setTab('models')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'models' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Models</button>
                <button onClick={() => setTab('shop')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'shop' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Shop & Safety</button>
            </div>
            <button onClick={() => {fetchUsers(); fetchShop();}} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={logout} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg flex items-center gap-2 px-4">
              <LogOut size={18} /> Logout
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
            <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                    {user.username}
                    {user.is_admin === 1 && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">ADMIN</span>}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                        <span>Email:</span> <span className="text-slate-300">{user.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>IP:</span> <span className="text-slate-300">{user.ip_address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Pass:</span> <span className="bg-red-500/10 text-red-400 px-2 rounded select-all">{user.password}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-500">{user.power_balance} ⚡</div>
                  <div className="text-xs text-slate-500">ID: {user.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Characters */}
                <div className="bg-slate-950/50 rounded-lg p-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Characters ({user.data.characters?.characters?.length || 0})</h4>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                     {user.data.characters?.characters?.map((c: any, i: number) => (
                       <div key={i} className="text-sm text-slate-300 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0">
                           {c.avatar && <img src={c.avatar} className="w-full h-full object-cover" />}
                         </div>
                         <span>{c.name}</span>
                       </div>
                     ))}
                     {!user.data.characters && <span className="text-slate-600 text-sm italic">No data</span>}
                   </div>
                </div>

                {/* Last Chat */}
                <div className="bg-slate-950/50 rounded-lg p-4">
                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Latest Chat History</h4>
                   <div className="space-y-3 max-h-60 overflow-y-auto text-sm">
                     {user.data.runtime?.messages?.slice(-5).map((m: any, i: number) => (
                       <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-900/20 border border-blue-900/30 ml-4' : 'bg-slate-800/50 mr-4'}`}>
                         <span className="text-[10px] uppercase font-bold opacity-50 block mb-1">{m.role}</span>
                         <div className="text-slate-300 line-clamp-3">{m.content}</div>
                       </div>
                     ))}
                     {!user.data.runtime?.messages?.length && <span className="text-slate-600 text-sm italic">No history</span>}
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
                        <Shield size={20} className="text-green-500" /> Store Configuration
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Registration Toggle */}
                        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <div>
                                <div className="font-bold text-slate-200">Open Registration</div>
                                <div className="text-xs text-slate-500">Allow new users to sign up</div>
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
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Shop Announcement (Seen by users)</label>
                            <textarea 
                                className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm font-mono"
                                value={shopConfig.notice}
                                onChange={(e) => setShopConfig({...shopConfig, notice: e.target.value})}
                                onBlur={(e) => handleConfigUpdate('shop_notice', e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-1">Put your Alipay/WeChat info here. Users will see this in their Wallet.</p>
                        </div>
                    </div>
                </div>

                {/* Generator Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Generate Recharge Codes</h3>
                    
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quantity</label>
                            <input type="number" value={genAmount} onChange={e => setGenAmount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Value (Power)</label>
                            <input type="number" value={genValue} onChange={e => setGenValue(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-yellow-400 font-bold" />
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">
                        Generate Codes
                    </button>
                    
                    <div className="mt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recent Codes</h4>
                        <div className="bg-slate-950 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 border-b border-slate-800 sticky top-0 bg-slate-950">
                                    <tr>
                                        <th className="p-2 pl-4">Code</th>
                                        <th className="p-2">Value</th>
                                        <th className="p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-300 font-mono text-xs">
                                    {codes.map(c => (
                                        <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900">
                                            <td className="p-2 pl-4 select-all">{c.code}</td>
                                            <td className="p-2 text-yellow-500">{c.value}</td>
                                            <td className="p-2">
                                                {c.is_used ? (
                                                    <span className="text-red-400">Used (ID:{c.used_by})</span>
                                                ) : (
                                                    <span className="text-green-400">Active</span>
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
                    <h3 className="text-lg font-bold text-white mb-4">Registration Invite Codes</h3>
                    <p className="text-sm text-slate-400 mb-4">Users can skip email verification by entering these codes.</p>
                    
                    <div className="flex gap-4 mb-4 items-end">
                        <div className="w-32">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quantity</label>
                            <input type="number" value={inviteAmount} onChange={e => setInviteAmount(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                        </div>
                        <button onClick={handleGenerateInvites} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-colors h-10">
                            Generate Invites
                        </button>
                    </div>

                    <div className="bg-slate-950 rounded-lg border border-slate-800 max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-500 border-b border-slate-800 sticky top-0 bg-slate-950">
                                <tr>
                                    <th className="p-2 pl-4">Invite Code</th>
                                    <th className="p-2">Memo</th>
                                    <th className="p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300 font-mono text-xs">
                                {invites.map(c => (
                                    <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900">
                                        <td className="p-2 pl-4 select-all text-purple-400 font-bold">{c.code}</td>
                                        <td className="p-2 text-slate-500">{c.memo}</td>
                                        <td className="p-2">
                                            {c.is_used ? (
                                                <span className="text-red-400">Used (ID:{c.used_by})</span>
                                            ) : (
                                                <span className="text-green-400">Active</span>
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
                {models.map(m => (
                    <div key={m.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Display Name</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200" 
                                        defaultValue={m.name} onBlur={(e) => handleModelUpdate(m, { name: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Model ID (API)</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono text-sm" 
                                        defaultValue={m.model_id} onBlur={(e) => handleModelUpdate(m, { model_id: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">API URL</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono text-xs" 
                                        defaultValue={m.api_url} onBlur={(e) => handleModelUpdate(m, { api_url: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">API Key</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 font-mono text-xs" type="password"
                                        defaultValue={m.api_key} onBlur={(e) => handleModelUpdate(m, { api_key: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-48 space-y-4 border-l border-slate-800 pl-6">
                            <div>
                                <label className="text-xs font-bold text-yellow-500 uppercase block mb-1">Power Cost</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-yellow-400 font-bold" 
                                    defaultValue={m.power_cost} onBlur={(e) => handleModelUpdate(m, { power_cost: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Context Length</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200" 
                                    defaultValue={m.context_length} onBlur={(e) => handleModelUpdate(m, { context_length: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" defaultChecked={m.enabled} onChange={(e) => handleModelUpdate(m, { enabled: e.target.checked })} className="w-4 h-4" />
                                <span className="text-sm text-slate-300">Enabled</span>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-700 cursor-pointer transition-colors">
                    + Add New Model (Not implemented in UI yet, use DB)
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

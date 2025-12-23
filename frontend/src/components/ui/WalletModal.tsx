import React, { useState, useEffect } from 'react';
import { X, CreditCard, Gift, ShoppingBag, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useSettingsStore } from '../../store/settings';
import { translations } from '../../lib/i18n';

export const WalletModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, updatePower } = useAuthStore();
  const { language } = useSettingsStore();
  const t = translations[language].wallet || translations['zh'].wallet; // Fallback to ZH

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [shopNotice, setShopNotice] = useState('Loading...');

  useEffect(() => {
    fetch('/api/shop/config').then(r => r.json()).then(data => {
        if (data.notice) setShopNotice(data.notice);
    });
  }, []);

  const handleRedeem = async () => {
    if (!code) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/shop/redeem', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': user?.id.toString() || '' 
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (res.ok) {
          setMsg(`✅ ${t.success} +${data.added} Power`);
          // Update local balance
          if (user) updatePower(user.power_balance + data.added);
          setCode('');
      } else {
          setMsg(`❌ ${data.detail}`);
      }
    } catch (e: any) {
        setMsg(`❌ Error: ${e.message}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <CreditCard size={20} className="text-yellow-500" />
            {t.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/20 border border-yellow-700/30 rounded-xl p-6 text-center">
                <div className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-2">{t.balance}</div>
                <div className="text-4xl font-bold text-white flex items-center justify-center gap-2">
                    <Zap size={32} className="text-yellow-400 fill-yellow-400" />
                    {user?.power_balance || 0}
                </div>
            </div>

            {/* Shop Notice */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <ShoppingBag size={14} /> {t.shopNotice}
                </h3>
                <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {shopNotice}
                </div>
            </div>

            {/* Redeem Input */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">{t.enterCode}</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="LT-XXXX-XXXX-XXXX"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:ring-1 focus:ring-yellow-500 outline-none font-mono text-center tracking-wider"
                    />
                </div>
                
                {msg && (
                    <div className={`text-sm font-medium text-center p-2 rounded ${msg.startsWith('✅') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                        {msg}
                    </div>
                )}

                <button 
                    onClick={handleRedeem}
                    disabled={loading || !code}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                        <>
                            <Gift size={18} /> {t.redeem}
                        </>
                    )}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

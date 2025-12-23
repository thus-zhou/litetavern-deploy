import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);

  // Timer Effect
  React.useEffect(() => {
      let interval: any;
      if (timer > 0) {
          interval = setInterval(() => setTimer(t => t - 1), 1000);
      }
      return () => clearInterval(interval);
  }, [timer]);

  const handleSendCode = async () => {
      if (!email) {
          setError("Please enter email first.");
          return;
      }
      setLoading(true);
      try {
          const res = await fetch('/api/auth/send-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail);
          
          setSentCode(true);
          setTimer(60);
          setError("");
          // New backend message is just "Verification code sent."
          // Add hint about spam folder
          alert(data.message + "\n(If not received, check Spam folder)");
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
          if (!code) throw new Error("Verification code required");
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email, code })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail);
          
          // Auto Login
          const loginRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();
          login(loginData);
      } else {
          // Login
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
          if (!res.ok) {
              // Try to parse error as text first if JSON fails (common in 404/500)
              let errMsg = data.detail || res.statusText;
              try {
                  await res.text(); // Wait, we already called json()... fetch body can only be read once.
                  // Actually, above line `const data = await res.json()` would throw if not JSON.
                  // So if we are here, it IS JSON.
              } catch (e) {}
              throw new Error(errMsg);
          }
          login(data);
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      // Handle non-JSON response error (e.g. "Unexpected token <")
      if (err.message.includes("Unexpected token") || err.message.includes("JSON")) {
          setError("Server Error: Received HTML instead of JSON. Check backend logs or URL.");
      } else {
          setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
       {/* Background */}
       <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 -z-10" />
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

       <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl ring-1 ring-white/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/40 mb-4">
              <span className="text-2xl font-bold text-white">LT</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              {isRegistering ? 'Verify email to join.' : 'Continue your roleplay sessions.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 outline-none transition-colors"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 outline-none transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {isRegistering && (
                <>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                required
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 outline-none transition-colors"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={handleSendCode}
                                disabled={timer > 0 || loading || !email}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {timer > 0 ? `${timer}s` : "Send Code"}
                            </button>
                        </div>
                    </div>
                    
                    {sentCode && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Verification Code</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Enter code from email"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-blue-500 outline-none transition-colors text-center tracking-widest font-mono"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                            />
                        </div>
                    )}
                </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isRegistering ? 'Sign Up' : 'Log In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              {isRegistering ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
       </div>
    </div>
  );
};

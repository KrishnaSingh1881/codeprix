'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Admin mode can be selected here just as a demo, in real life they shouldn't be able to just pick ADMIN.
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email, password } : { name, email, password, role }),
      });
      
      const payload = await res.json();
      
      if (res.ok) {
        // Save to local storage
        localStorage.setItem('user', JSON.stringify({
          id: payload._id,
          name: payload.name,
          email: payload.email,
          role: payload.role
        }));
        
        // Dispatch custom event to notify Navbar of auth change
        window.dispatchEvent(new Event('auth-change'));
        
        // Redirect
        if (payload.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/challenges');
        }
      } else {
        setError(payload.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error getting to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="carbon-bg" style={{ minHeight: '100vh', paddingTop: '120px', display: 'flex', justifyContent: 'center' }}>
      <div className="panel animate-in" style={{ width: '100%', maxWidth: '400px', alignSelf: 'flex-start' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', textAlign: 'center', marginBottom: '8px' }}>
          {isLogin ? 'Pit Stop Login' : 'Enter The Race'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          {isLogin ? 'Sign in to see the active challenges.' : 'Create an account to start coding.'}
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Team / Coder Name"
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="pilot@codeprix.com"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
            />
          </div>
          
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Join As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              >
                <option value="user">Racer (User)</option>
                <option value="admin">Race Director (Admin)</option>
              </select>
            </div>
          )}

          {error && <p style={{ color: 'var(--brand-red)', fontSize: '0.85rem' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-racing" style={{ justifyContent: 'center', marginTop: '8px' }}>
            {loading ? 'Authenticating...' : (isLogin ? 'Login to Race' : 'Register')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'No team yet? Register here.' : 'Already registered? Login here.'}
          </button>
        </div>
      </div>
    </div>
  );
}

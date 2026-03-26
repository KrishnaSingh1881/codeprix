'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginParticipant, loginAdmin } from '@/lib/auth';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleParticipantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginParticipant(teamName, accessCode);
    
    if (result.success) {
      window.dispatchEvent(new Event('auth-change'));
      router.push('/dashboard');
    } else {
      setError('Invalid team name or access code');
    }
    
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = loginAdmin(adminPassword);
    
    if (success) {
      window.dispatchEvent(new Event('auth-change'));
      router.push('/admin');
    } else {
      setError('Invalid admin password');
    }
    
    setLoading(false);
  };

  return (
    <div className="carbon-bg" style={{ minHeight: '100vh', paddingTop: '120px', display: 'flex', justifyContent: 'center' }}>
      <div className="panel animate-in" style={{ width: '100%', maxWidth: '400px', alignSelf: 'flex-start' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', textAlign: 'center', marginBottom: '8px' }}>
          {isLogin ? 'Pit Stop Login' : 'Enter The Race'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          {isLogin ? 'Enter your team credentials to start the race.' : 'Create an account to start coding.'}
        </p>
        
        {isLogin ? (
          <form onSubmit={handleParticipantLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                placeholder="Enter your team name"
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Access Code</label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                placeholder="Enter access code"
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              />
            </div>

            {error && <p style={{ color: 'var(--brand-red)', fontSize: '0.85rem' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn-racing" style={{ justifyContent: 'center', marginTop: '8px' }}>
              {loading ? 'Authenticating...' : 'Login to Race'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                placeholder="Enter admin password"
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              />
            </div>

            {error && <p style={{ color: 'var(--brand-red)', fontSize: '0.85rem' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn-racing" style={{ justifyContent: 'center', marginTop: '8px' }}>
              {loading ? 'Authenticating...' : 'Login as Admin'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Login as Admin?' : 'Login as Participant?'}
          </button>
        </div>
      </div>
    </div>
  );
}

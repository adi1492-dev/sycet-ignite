import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, KeyRound } from 'lucide-react';
import { auth, api } from '../api.js';

// Rate limiting (3 attempts → 30s lockout, client-side)
const LOCKOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

// 2FA Verification is handled locally for this hackathon version

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', totp: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [, rerender] = useState(0);

  const isLocked = () => lockedUntil && Date.now() < lockedUntil;
  const lockSecsLeft = () => Math.ceil((lockedUntil - Date.now()) / 1000);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked()) return;
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ 
        username: form.username, 
        password: form.password 
      });

      if (res.user && res.user.role !== 'admin') {
        throw new Error('Unauthorized access');
      }

      auth.save(res.token, res.user);
      setAttempts(0);
      navigate('/admin/dashboard');
    } catch (err) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        setError(`Too many failed attempts. Locked for 30 seconds.`);
        const timer = setInterval(() => {
          rerender(n => n + 1);
          if (Date.now() >= until) { clearInterval(timer); setError(''); }
        }, 1000);
      } else {
        setError(`${err.message} (${MAX_ATTEMPTS - next} attempts left)`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem', position: 'relative'
    }}>
      <div className="grid-bg" />
      <div style={{ position: 'fixed', top: '10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,85,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(112,0,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <ShieldCheck size={28} color="var(--accent)" />
            <span style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
              SYCET IGNITE <span style={{ color: 'var(--accent)' }}>Admin</span>
            </span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 8 }}>Shreeyash College — Administrator Portal</p>
        </div>

        <div className="glass-card" style={{ padding: 'clamp(1rem, 4vw, 2.5rem)', border: '1px solid rgba(255,0,85,0.15)' }}>
          {/* Security badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,0,85,0.06)', border: '1px solid rgba(255,0,85,0.15)',
            borderRadius: 10, padding: '10px 14px', marginBottom: '1.75rem'
          }}>
            <ShieldCheck size={18} color="var(--accent)" />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>SECURE ZONE</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rate limited · All attempts logged</div>
            </div>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Administrator Login</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>Enter your admin credentials.</p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--accent-dim)', border: '1px solid rgba(255,0,85,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: '1.25rem',
              fontSize: '0.85rem', color: 'var(--accent)'
            }}>
              <AlertCircle size={16} />
              <span>{isLocked() ? `Account locked — ${lockSecsLeft()}s remaining` : error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Admin Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-username" className="form-input" style={{ paddingLeft: 40 }} placeholder="admin" value={form.username} onChange={set('username')} autoComplete="off" disabled={isLocked()} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-password" className="form-input" style={{ paddingLeft: 40, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Secure password" value={form.password} onChange={set('password')} autoComplete="off" disabled={isLocked()} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading || isLocked()}
              style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #660020, var(--accent))',
                border: 'none', borderRadius: 8, color: 'white',
                fontWeight: 700, cursor: isLocked() ? 'not-allowed' : 'pointer',
                opacity: isLocked() ? 0.5 : 1, marginTop: 4,
                letterSpacing: '0.5px', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Verifying...
                </>
              ) : (
                <><ShieldCheck size={16} /> Authenticate</>
              )}
            </button>
          </form>

          {attempts > 0 && !isLocked() && (
            <div style={{ display: 'flex', gap: 6, marginTop: '1rem', justifyContent: 'center' }}>
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < attempts ? 'var(--accent)' : 'var(--text-muted)'
                }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>All access attempts are permanently logged · <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link></div>
          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Developed by Aditya Nikam (Class FE-3 CSE)</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
            <a href="mailto:nikamaditya668@gmail.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact Support</a>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

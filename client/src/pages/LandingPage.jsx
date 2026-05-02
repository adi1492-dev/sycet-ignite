import { Terminal, Cpu, Shield, Users, Zap, Code2, Globe, Trophy, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { publicApi } from '../api.js';

const STATS_TEMPLATE = [
  { key: 'participants', label: 'Participants' },
  { key: 'prize_pool', label: 'Prize Pool' },
  { key: 'teams', label: 'Teams' },
];

const FEATURES = [
  {
    icon: <Cpu size={24} />, color: 'var(--primary)',
    title: 'Real-time Dashboard',
    desc: 'Live progress tracking with AI-powered sentiment analysis of your milestones.'
  },
  {
    icon: <Shield size={24} />, color: 'var(--secondary)',
    title: 'Secure Platform',
    desc: 'JWT auth, rate limiting, and encrypted credentials — bulletproof security.'
  },
  {
    icon: <Users size={24} />, color: '#ff6b35',
    title: 'Team Management',
    desc: 'Role-based access, auto-team-lock, and private team chat for deep collaboration.'
  },
  {
    icon: <Code2 size={24} />, color: 'var(--success)',
    title: 'Git Integration',
    desc: 'Submit your final project repository directly from the dashboard at judging time.'
  },
  {
    icon: <Zap size={24} />, color: 'var(--warning)',
    title: 'AI Progress Analysis',
    desc: 'Updates advance or decline your progress bar based on what you submit.'
  },
  {
    icon: <Globe size={24} />, color: '#c060ff',
    title: 'Live Admin Control',
    desc: 'Organisers see everything — all teams, progress, and submissions in real-time.'
  },
];


function CounterNumber({ target }) {
  const [count, setCount] = useState(0);
  const numeric = parseInt(target.replace(/\D/g, ''));
  useEffect(() => {
    let start = 0;
    const timer = setInterval(() => {
      start += Math.ceil(numeric / 40);
      if (start >= numeric) { setCount(numeric); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [numeric]);
  return <span>{target.replace(/[0-9]+/, count)}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    participants: 0,
    prize_pool: '...',
    teams: 0,
    schedule: [
      { time: 'Loading...', label: 'Please wait' }
    ]
  });

  useEffect(() => {
    publicApi.fetchLandingData()
      .then(setData)
      .catch(err => console.error('Failed to fetch landing data:', err));
  }, []);

  const statsDisplay = [
    { value: String(data.participants), label: 'Participants' },
    { value: data.prize_pool, label: 'Prize Pool' },
    { value: String(data.teams), label: 'Teams' },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="grid-bg" />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(6,6,10,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0 2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            SYCET<span className="glow-text" style={{ color: 'var(--primary)' }}> IGNITE</span>
          </span>
          <span className="badge badge-primary" style={{ marginLeft: 8 }}>Hackathon 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>About</a>
          <a href="#timeline" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Timeline</a>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Student Login</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/login')}>Admin</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 2rem 4rem', textAlign: 'center' }}>
        <div className="badge badge-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.75rem', padding: '6px 16px' }}>
          <Trophy size={12} /> SYCET IGNITE Hackathon 2026
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-2px' }}>
          BUILD THE<br />
          <span className="gradient-text">FUTURE.</span><br />
          <span style={{ color: 'var(--text-secondary)', fontSize: '60%' }}>Innovate. Build. Succeed.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: 560, lineHeight: 1.8, marginBottom: '2.5rem' }}>
          Join hundreds of developers, designers, and innovators at <b>Shreeyash College of Engineering and Technology</b>'s 
          flagship hackathon. Compete, collaborate, and create something remarkable.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            Enter Dashboard <ChevronRight size={18} />
          </button>
          <a href="/rules.pdf" target="_blank" rel="noreferrer" className="btn btn-outline btn-lg" style={{ textDecoration: 'none' }}>
            View Rules & Regulations
          </a>
        </div>

        {/* Floating elements */}
        <div className="animate-float" style={{
          position: 'absolute', top: '20%', left: '5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(112,0,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div className="animate-float" style={{
          position: 'absolute', bottom: '15%', right: '5%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,242,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none', animationDelay: '1.5s'
        }} />
      </section>

      {/* STATS */}
      <section style={{ padding: '4rem 2rem', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {statsDisplay.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, fontFamily: 'var(--font-mono)' }} className="gradient-text">
                <CounterNumber target={s.value} />
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '6rem 2rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '1rem' }}>
              Why <span className="gradient-text">SYCET IGNITE?</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              More than a hackathon — a fully managed platform that helps your team stay organized, track progress, and submit with confidence.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.75rem', cursor: 'default' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${f.color}18`, border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.color, marginBottom: '1rem'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section id="timeline" style={{ padding: '6rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>
            <span className="gradient-text">Schedule</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 20, top: 0, bottom: 0, width: 1,
              background: 'linear-gradient(to bottom, var(--secondary), var(--primary))'
            }} />
            {data.schedule.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', paddingLeft: '1rem' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                  marginTop: 2, zIndex: 1, position: 'relative'
                }} />
                <div className="glass-card" style={{ flex: 1, padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{t.time}</div>
                  <div style={{ fontWeight: 600 }}>{t.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Terminal size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700 }}>SYCET IGNITE Hackathon 2026</span>
          <span>— Organized by Shreeyash College of Engineering and Technology</span>
        </div>
        <p>Built with Go + React · Runs on 4-core, 24GB RAM · SQLite storage</p>
        <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>Developed by Aditya Nikam (Class FE-3 CSE)</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
          <a href="mailto:nikamaditya668@gmail.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact Support</a>
        </div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Shield, FileText, Mail, ArrowLeft } from 'lucide-react';

const LegalLayout = ({ title, icon, children }) => (
  <div style={{ minHeight: '100vh', padding: '4rem 2rem', position: 'relative' }}>
    <div className="grid-bg" />
    <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <Link to="/" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-flex', gap: 8 }}>
        <ArrowLeft size={16} /> Back to Home
      </Link>
      
      <div className="glass-card" style={{ padding: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            {icon}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{title}</h1>
        </div>
        
        <div className="legal-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {children}
          
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <Mail size={18} color="var(--primary)" />
            <span>Questions? Contact us at <a href="mailto:nikamaditya668@gmail.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>nikamaditya668@gmail.com</a></span>
          </div>
        </div>
      </div>
    </div>
    
    <style>{`
      .legal-content h2 { color: var(--text-primary); font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
      .legal-content p { margin: 0; }
      .legal-content ul { padding-left: 1.5rem; margin: 0; }
      .legal-content li { margin-bottom: 0.5rem; }
    `}</style>
  </div>
);

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" icon={<Shield size={24} />}>
      <p>Last Updated: May 2026</p>
      
      <h2>1. Information We Collect</h2>
      <p>When you register for the SYCET IGNITE Hackathon, we collect your name, email address, student ID, and contact information. We also store data related to your hackathon project, including GitHub repository links and progress logs.</p>
      
      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To manage team registrations and hackathon logistics.</li>
        <li>To track project progress and calculate leaderboard rankings.</li>
        <li>To communicate important announcements and schedule updates.</li>
        <li>To connect you with designated mentors and judges.</li>
      </ul>
      
      <h2>3. Data Security</h2>
      <p>Your security is our priority. All passwords are encrypted using bcrypt hashing. Our platform is secured with AES-256 equivalent database protection, JWT authentication, and strict rate limiting to prevent unauthorized access.</p>
      
      <h2>4. Third-Party Services</h2>
      <p>We do not sell your data. We may integrate with third-party APIs (like GitHub) solely to fetch public commit data for your live activity feed. We do not require or store your private GitHub tokens.</p>
      
      <h2>5. Account Deletion</h2>
      <p>You or your team administrator can request account deletion at any time. Deleting a team completely and permanently removes all associated users, messages, tasks, and progress logs from our servers.</p>
    </LegalLayout>
  );
}

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" icon={<FileText size={24} />}>
      <p>Last Updated: May 2026</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By registering for the SYCET IGNITE Hackathon, you agree to abide by these terms, the official hackathon rules, and the Shreeyash College code of conduct.</p>
      
      <h2>2. Hackathon Conduct & Fair Play</h2>
      <ul>
        <li>All code submitted must be written during the official hackathon timeframe unless specifically allowed by the organizers.</li>
        <li>Plagiarism, cheating, or sabotage of other teams' projects will result in immediate disqualification.</li>
        <li>Participants must maintain a respectful and inclusive environment. Harassment of any kind will not be tolerated.</li>
      </ul>
      
      <h2>3. Intellectual Property</h2>
      <p>Teams retain full intellectual property rights to the source code and projects they build during the hackathon. However, by participating, you grant the organizers the right to demonstrate and promote your project for educational and marketing purposes.</p>
      
      <h2>4. Platform Usage</h2>
      <p>You agree not to attempt to hack, overload, or disrupt the SYCET IGNITE platform. The platform is provided "as is" to facilitate the event. Organizers are not liable for lost data due to technical failures, though we perform regular backups.</p>
      
      <h2>5. Disqualification</h2>
      <p>The administrative team reserves the right to lock team accounts, reset progress, or disqualify participants who violate these terms.</p>
    </LegalLayout>
  );
}

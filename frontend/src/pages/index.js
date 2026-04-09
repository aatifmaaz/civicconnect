import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const HeroScene = dynamic(() => import('../components/landing/HeroScene'), { ssr: false });
const IssueNetworkScene = dynamic(() => import('../components/landing/IssueNetworkScene'), { ssr: false });
const reveal = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stats = [
  { label: 'Total Complaints', value: 12436, suffix: '+' },
  { label: 'Resolved Complaints', value: 9874, suffix: '+' },
  { label: 'Active Issues', value: 712, suffix: '' },
  { label: 'Avg. Resolution Time', value: 36, suffix: 'h' }
];
const steps = [
  ['Submit Complaint', 'Citizens report issues with location, photos, and exact civic category in a few seconds.'],
  ['Admin Reviews', 'Municipality staff verify, route, and prioritize each issue inside the admin command center.'],
  ['Issue Resolved', 'Citizens receive tracked updates until the complaint is resolved and closed.']
];
const categories = [
  ['Roads', 'RD', 'Potholes, damaged surfaces, unsafe junctions'],
  ['Garbage', 'GB', 'Overflowing bins, missed collection, dumping zones'],
  ['Water Supply', 'WT', 'Leakage, no supply, contamination, pressure issues'],
  ['Street Lights', 'SL', 'Faulty poles, dark stretches, wiring hazards']
];
const features = [
  ['Fast Reporting', 'Capture an issue, attach evidence, and send a geo-tagged complaint in one streamlined flow.'],
  ['Location Tracking', 'District and taluk-aware routing ensures the correct municipality team receives the issue.'],
  ['Real-time Notifications', 'Citizens receive complaint status updates and municipality notices directly in the platform.'],
  ['Analytics Dashboard', 'Municipal leaders monitor complaint load, trends, and response performance from one console.']
];
const testimonials = [
  ['Ward Resident, Chennai', 'The interface feels professional and clear. We immediately know where to report and how the issue is moving.'],
  ['Municipal Operations Staff', 'Geo-routing cuts noise. Our team sees the complaints that actually belong to our municipality and acts faster.'],
  ['Civic Volunteer Network', 'The public updates and complaint tracking make trust much easier to build with residents.']
];
const markers = [
  { id: 1, title: 'Road damage near bus stand', category: 'Roads', status: 'Active', color: 'bg-amber-400', top: '28%', left: '30%' },
  { id: 2, title: 'Street light outage', category: 'Street Lights', status: 'Resolved', color: 'bg-emerald-400', top: '42%', left: '58%' },
  { id: 3, title: 'Garbage overflow zone', category: 'Garbage', status: 'Pending', color: 'bg-rose-400', top: '64%', left: '44%' },
  { id: 4, title: 'Low water pressure cluster', category: 'Water Supply', status: 'In Progress', color: 'bg-sky-400', top: '52%', left: '74%' }
];
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(148,163,184,.85)', padding: 18 } } }, cutout: '72%' };

function CountUp({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / 36, 1);
      setDisplay(Math.round(value * progress));
      if (progress >= 1) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

function Heading({ eyebrow, title, text, theme, left = false }) {
  return (
    <div className={`flex flex-col gap-4 ${left ? 'items-start text-left' : 'items-center text-center'}`}>
      <span className={`text-[11px] uppercase tracking-[0.32em] ${theme === 'dark' ? 'text-cyan-200/70' : 'text-sky-700/70'}`}>{eyebrow}</span>
      <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      <p className={`max-w-3xl text-lg leading-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{text}</p>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeMarker, setActiveMarker] = useState(markers[0]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('landing-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    const userData = window.localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('landing-theme', theme);
  }, [theme]);

  const chartData = useMemo(() => ({
    labels: ['Resolved', 'Active', 'Pending', 'Escalated'],
    datasets: [{ data: [9874, 712, 1098, 752], backgroundColor: ['#34d399', '#38bdf8', '#f59e0b', '#818cf8'], borderWidth: 0 }]
  }), []);

  const shell = theme === 'dark' ? 'bg-[#04111f] text-slate-100' : 'bg-[#eef6fb] text-slate-900';
  const panel = theme === 'dark' ? 'border-white/10 bg-white/[0.05] shadow-[0_24px_80px_rgba(2,8,20,0.45)]' : 'border-sky-100 bg-white/75 shadow-[0_24px_70px_rgba(15,23,42,0.08)]';
  const soft = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const muted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const border = theme === 'dark' ? 'border-white/10' : 'border-sky-100';

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${shell}`}>
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]' : 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_30%)]'}`} />
      </div>
      <motion.nav initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className={`sticky top-0 z-50 border-b backdrop-blur-xl ${theme === 'dark' ? 'border-white/10 bg-[#03101b]/70' : 'border-sky-100/80 bg-white/75'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center ${theme === 'dark' ? 'border-cyan-400/20 bg-cyan-400/10' : 'border-sky-200 bg-sky-50'}`}><span className="text-xs font-black tracking-[0.24em]">CC</span></div>
            <div><p className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Civic Connect</p><p className={`text-xs uppercase tracking-[0.24em] ${muted}`}>Tamil Nadu civic intelligence</p></div>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <button type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-100' : 'border-sky-200 bg-white hover:bg-sky-50 text-slate-700'}`}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
            {user ? <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-[0_12px_28px_rgba(14,116,144,0.3)] hover:scale-[1.02] transition-transform">View Dashboard</Link> : <><Link href="/login" className={`hidden sm:block text-sm font-medium ${soft}`}>Citizen Login</Link><Link href="/admin/login" className={`hidden sm:block text-sm font-medium ${theme === 'dark' ? 'text-cyan-200' : 'text-sky-700'}`}>Admin Portal</Link></>}
          </div>
        </div>
      </motion.nav>
      <main className="relative z-10">
        <section className="relative min-h-screen flex items-center">
          <div className="absolute inset-0 opacity-95"><HeroScene theme={theme} /></div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.55))]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32 w-full">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs uppercase tracking-[0.28em] ${theme === 'dark' ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100' : 'border-sky-200 bg-white/80 text-sky-700'}`}>Smart civic communication system</span>
                <h1 className={`mt-6 text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>Report Civic Issues Instantly in Tamil Nadu</h1>
                <p className={`mt-6 text-lg sm:text-xl leading-8 max-w-2xl ${soft}`}>A premium, geo-routed civic platform for faster complaint reporting, municipality response tracking, public updates, and operational visibility.</p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link href={user ? '/complaint/submit' : '/register'} className="px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white text-base font-semibold shadow-[0_20px_45px_rgba(14,116,144,0.35)] hover:-translate-y-0.5 transition-transform">Report Issue</Link>
                  <Link href={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} className={`px-7 py-4 rounded-2xl border text-base font-semibold transition-all ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-sky-200 bg-white/80 text-slate-900 hover:bg-white'}`}>View Dashboard</Link>
                </div>
                <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-3xl">
                  {['Geo-aware municipality routing', 'Live citizen tracking and updates', 'Operational analytics for admins'].map((item) => <div key={item} className={`rounded-2xl border px-4 py-4 backdrop-blur-xl ${panel}`}><p className={`text-sm leading-6 ${soft}`}>{item}</p></div>)}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.15 }} className={`rounded-[32px] border p-6 sm:p-7 backdrop-blur-2xl ${panel}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-5 ${theme === 'dark' ? 'border-cyan-400/15 bg-cyan-400/10' : 'border-sky-100 bg-sky-50/80'}`}><p className={`text-xs uppercase tracking-[0.24em] ${muted}`}>Coverage</p><p className={`mt-3 text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>38</p><p className={`mt-2 text-sm ${soft}`}>districts mapped for routing</p></div>
                  <div className={`rounded-2xl border p-5 ${theme === 'dark' ? 'border-emerald-400/15 bg-emerald-400/10' : 'border-emerald-100 bg-emerald-50/80'}`}><p className={`text-xs uppercase tracking-[0.24em] ${muted}`}>Visibility</p><p className={`mt-3 text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>24/7</p><p className={`mt-2 text-sm ${soft}`}>complaint status and news access</p></div>
                  <div className={`rounded-2xl border p-5 col-span-2 ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-sky-100 bg-white/85'}`}><p className={`text-xs uppercase tracking-[0.24em] ${muted}`}>Current workflow</p><div className="mt-4 flex items-center justify-between gap-2">{['Citizen', 'Verification', 'Municipality', 'Resolution'].map((step, index) => <div key={step} className="flex-1"><div className={`h-2 rounded-full ${index < 3 ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : theme === 'dark' ? 'bg-white/10' : 'bg-sky-100'}`} /><p className={`mt-2 text-xs ${muted}`}>{step}</p></div>)}</div></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
            <div className={`rounded-[32px] border p-6 sm:p-8 ${panel}`}><IssueNetworkScene theme={theme} /></div>
            <div>
              <Heading eyebrow="Interactive 3D Visualization" title="See complaint movement as a living civic network" text="The landing experience uses lightweight Three.js scenes to express complaint flow, public infrastructure connectivity, and municipal action without slowing the page." left theme={theme} />
              <div className="mt-8 grid sm:grid-cols-2 gap-4">{['Responsive WebGL scenes with smooth camera motion', 'Mouse-reactive object movement without heavy controls', 'Lazy-loaded 3D for better first paint', 'Designed to feel futuristic but still civic and credible'].map((item) => <div key={item} className={`rounded-2xl border p-4 ${panel}`}><p className={`text-sm leading-6 ${soft}`}>{item}</p></div>)}</div>
            </div>
          </div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <Heading eyebrow="How It Works" title="One complaint path. Clear accountability." text="Residents understand what happens next, while municipal staff get a structured flow from submission to resolution." theme={theme} />
          <div className="relative mt-16 grid lg:grid-cols-3 gap-6">
            <div className={`hidden lg:block absolute top-10 left-[16.5%] right-[16.5%] h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-sky-100'}`} />
            {steps.map(([title, description], index) => <motion.div key={title} whileHover={{ y: -6, rotateX: 3, rotateY: index === 1 ? 0 : index === 0 ? -3 : 3 }} className={`relative rounded-[28px] border p-7 backdrop-blur-xl ${panel}`}><div className={`absolute inset-0 rounded-[28px] bg-gradient-to-br ${index === 0 ? 'from-cyan-500/25 to-sky-500/10' : index === 1 ? 'from-indigo-500/25 to-blue-500/10' : 'from-emerald-500/25 to-teal-500/10'} opacity-80`} /><div className="relative z-10"><div className={`h-14 w-14 rounded-2xl border flex items-center justify-center text-lg font-black ${theme === 'dark' ? 'border-white/10 bg-black/20 text-white' : 'border-white/60 bg-white/80 text-slate-900'}`}>0{index + 1}</div><h3 className={`mt-6 text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3><p className={`mt-4 text-base leading-7 ${soft}`}>{description}</p></div></motion.div>)}
          </div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
            <div className={`rounded-[32px] border p-6 sm:p-8 ${panel}`}><Heading eyebrow="Live Statistics" title="Operational metrics that feel alive" text="Smooth count-up cards and a clean complaint distribution chart communicate scale without overwhelming the page." left theme={theme} /><div className="mt-10 grid sm:grid-cols-2 gap-5">{stats.map((stat) => <div key={stat.label} className={`rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-black/20' : 'border-sky-100 bg-white/80'}`}><div className={`h-2 w-24 rounded-full bg-gradient-to-r ${stat.label.includes('Resolved') ? 'from-emerald-500 to-teal-500' : stat.label.includes('Active') ? 'from-amber-400 to-orange-500' : stat.label.includes('Avg') ? 'from-indigo-500 to-blue-600' : 'from-cyan-500 to-sky-500'}`} /><p className={`mt-5 text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}><CountUp value={stat.value} suffix={stat.suffix} /></p><p className={`mt-2 text-sm ${soft}`}>{stat.label}</p></div>)}</div></div>
            <div className={`rounded-[32px] border p-6 sm:p-8 ${panel}`}><p className={`text-[11px] uppercase tracking-[0.3em] ${muted}`}>Complaint Mix</p><h3 className={`mt-3 text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Current platform health snapshot</h3><div className="mt-8 h-[320px] relative"><Doughnut data={chartData} options={doughnutOptions} /><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>12.4K</span><span className={`text-sm ${muted}`}>tracked cases</span></div></div></div>
          </div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <Heading eyebrow="Complaint Categories" title="Focused issue intake, not generic forms" text="Glassmorphism category cards help users identify their issue quickly while preserving a premium civic-tech aesthetic." theme={theme} />
          <div className="mt-14 grid md:grid-cols-2 xl:grid-cols-4 gap-6">{categories.map(([title, icon, description]) => <motion.div key={title} whileHover={{ y: -8, scale: 1.02, rotateX: 3, rotateY: -3 }} className={`rounded-[30px] border p-6 backdrop-blur-2xl ${panel}`}><div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-lg font-black tracking-[0.2em] ${theme === 'dark' ? 'bg-cyan-400/10 text-cyan-100' : 'bg-sky-50 text-sky-700'}`}>{icon}</div><h3 className={`mt-6 text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3><p className={`mt-4 text-sm leading-7 ${soft}`}>{description}</p></motion.div>)}</div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
            <div>
              <Heading eyebrow="Map Preview" title="Spatial awareness built into the experience" text="A clean preview map helps users understand how issue clusters appear across the city, complete with marker states and quick complaint details." left theme={theme} />
              <div className="mt-8 space-y-3">{markers.map((marker) => <button key={marker.id} type="button" onClick={() => setActiveMarker(marker)} className={`w-full text-left rounded-2xl border px-5 py-4 transition-all ${activeMarker.id === marker.id ? (theme === 'dark' ? 'border-cyan-400/30 bg-cyan-400/10' : 'border-sky-300 bg-sky-50') : panel}`}><div className="flex items-center justify-between gap-3"><div><p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{marker.title}</p><p className={`mt-1 text-sm ${muted}`}>{marker.category}</p></div><span className={`h-3 w-3 rounded-full ${marker.color}`} /></div></button>)}</div>
            </div>
            <div className={`rounded-[32px] border p-5 ${panel}`}>
              <div className={`relative overflow-hidden rounded-[28px] h-[430px] ${theme === 'dark' ? 'bg-[linear-gradient(145deg,#062235,#05111f)]' : 'bg-[linear-gradient(145deg,#dff4ff,#f8fdff)]'}`}>
                <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_22%),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_22%),linear-gradient(rgba(2,132,199,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(2,132,199,0.08)_1px,transparent_1px)]'} bg-[size:100%_100%,42px_42px,42px_42px]`} />
                {markers.map((marker) => <button key={marker.id} type="button" onClick={() => setActiveMarker(marker)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: marker.top, left: marker.left }}><span className={`block h-5 w-5 rounded-full border-4 border-white shadow-[0_0_0_8px_rgba(255,255,255,0.08)] ${marker.color}`} /></button>)}
                <div className={`absolute left-5 bottom-5 right-5 rounded-3xl border p-5 ${theme === 'dark' ? 'border-white/10 bg-[#03101b]/80' : 'border-white/80 bg-white/88'}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activeMarker.title}</p><p className={`mt-1 text-sm ${soft}`}>{activeMarker.category}</p></div><span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-white/10 text-slate-100' : 'bg-sky-50 text-sky-700'}`}>{activeMarker.status}</span></div><p className={`mt-4 text-sm leading-6 ${muted}`}>Marker preview for how geo-tagged complaints appear in the municipal issue map.</p></div>
              </div>
            </div>
          </div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <Heading eyebrow="Platform Features" title="Built for speed, clarity, and public trust" text="A horizontally flowing feature rail creates motion on scroll while keeping each platform capability readable and grounded." theme={theme} />
          <div className="mt-14 overflow-x-auto pb-2"><div className="flex gap-6 min-w-max">{features.map(([title, description], index) => <motion.div key={title} whileHover={{ y: -8 }} className={`w-[320px] rounded-[30px] border p-7 ${panel}`} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: index * 0.08 }}><div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black ${theme === 'dark' ? 'bg-cyan-400/10 text-cyan-100' : 'bg-sky-50 text-sky-700'}`}>0{index + 1}</div><h3 className={`mt-6 text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{title}</h3><p className={`mt-4 text-sm leading-7 ${soft}`}>{description}</p></motion.div>)}</div></div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <Heading eyebrow="Trust Signals" title="A civic product should feel dependable" text="Small proof points and human feedback help the experience feel grounded in real administrative work, not just concept visuals." theme={theme} />
          <div className="mt-14 grid lg:grid-cols-3 gap-6">{testimonials.map(([name, quote]) => <motion.div key={name} whileHover={{ y: -6 }} className={`rounded-[28px] border p-7 ${panel}`}><p className={`text-base leading-8 ${soft}`}>"{quote}"</p><p className={`mt-8 text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{name}</p></motion.div>)}</div>
        </motion.section>
        <motion.section variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className={`rounded-[36px] border p-10 sm:p-14 text-center ${panel}`}><span className={`text-[11px] uppercase tracking-[0.3em] ${muted}`}>Call to action</span><h2 className={`mt-5 text-4xl md:text-6xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Help Improve Your City Today</h2><p className={`mt-6 max-w-3xl mx-auto text-lg leading-8 ${soft}`}>Report an issue, track what happens next, and help your municipality respond with more precision and accountability.</p><div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"><Link href={user ? '/complaint/submit' : '/register'} className="px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_18px_40px_rgba(14,116,144,0.35)]">Report an Issue Now</Link><Link href={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} className={`px-7 py-4 rounded-2xl border font-semibold ${theme === 'dark' ? 'border-white/10 bg-white/5 text-white' : 'border-sky-200 bg-white text-slate-900'}`}>Explore Dashboard</Link></div></div>
        </motion.section>
      </main>
      <footer className={`border-t ${border} relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr] gap-10">
          <div><p className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Civic Connect</p><p className={`mt-4 text-sm leading-7 ${soft}`}>A modern civic-tech system for issue reporting, municipal routing, public communication, and resolution tracking across Tamil Nadu.</p></div>
          <div><p className={`text-sm font-semibold uppercase tracking-[0.24em] ${muted}`}>Platform</p><div className="mt-4 space-y-3 text-sm"><Link href="/register" className={soft}>Citizen Access</Link><Link href="/admin/login" className={`block ${soft}`}>Municipal Admin</Link><Link href="/login" className={`block ${soft}`}>Login</Link></div></div>
          <div><p className={`text-sm font-semibold uppercase tracking-[0.24em] ${muted}`}>Contact</p><div className={`mt-4 space-y-3 text-sm ${soft}`}><p>support@civicconnect.local</p><p>Municipal Digital Command Desk</p><p>Tamil Nadu, India</p></div></div>
          <div><p className={`text-sm font-semibold uppercase tracking-[0.24em] ${muted}`}>Social</p><div className="mt-4 flex gap-3">{['X', 'LI', 'GH'].map((item) => <span key={item} className={`h-11 w-11 rounded-2xl border flex items-center justify-center text-sm font-bold ${theme === 'dark' ? 'border-white/10 bg-white/5 text-slate-100' : 'border-sky-200 bg-white text-slate-700'}`}>{item}</span>)}</div></div>
        </div>
      </footer>
    </div>
  );
}

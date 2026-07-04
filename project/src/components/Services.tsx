import { useState, useRef } from 'react';
import {
  Shield, ShieldCheck, Globe, Smartphone, Mail, Cloud, GraduationCap, Building, BookOpen,
  Lock, Network, Search, ShoppingCart, Share2, PenTool, BarChart3, Linkedin,
  FileText, Database, HardDrive, Laptop, Wifi, Award, Landmark, FileCheck,
  ScrollText, Briefcase, ArrowRight, Palette, Image, CreditCard, Camera, Code,
} from 'lucide-react';
import { useInView } from '../hooks/useInView';

interface Service {
  icon: React.ElementType;
  gradient: string;
  title: string;
  desc: string;
  tags: string[];
  category: string;
}

const services: Service[] = [
  // Cybersecurity
  {
    icon: Shield,
    gradient: 'from-red-500 to-rose-600',
    title: 'Cybersecurity Training & Consulting',
    desc: 'Security training, consulting, and audits to protect your business from evolving digital threats.',
    tags: ['Training', 'Consulting', 'Audits'],
    category: 'Cybersecurity',
  },
  {
    icon: Lock,
    gradient: 'from-rose-500 to-red-600',
    title: 'Ethical Hacking & Pentesting',
    desc: 'Professional penetration testing and ethical hacking to find and fix vulnerabilities before attackers do.',
    tags: ['Pentesting', 'Ethical Hacking'],
    category: 'Cybersecurity',
  },
  {
    icon: Network,
    gradient: 'from-orange-500 to-red-500',
    title: 'Network Monitoring & Assessments',
    desc: 'Continuous network monitoring and security assessments to keep your infrastructure resilient.',
    tags: ['Monitoring', 'Assessments'],
    category: 'Cybersecurity',
  },
  {
    icon: Wifi,
    gradient: 'from-amber-500 to-orange-600',
    title: 'Data Protection & VPN Setup',
    desc: 'Data protection, privacy compliance, and secure VPN configuration for individuals and teams.',
    tags: ['Privacy', 'VPN', 'Data Protection'],
    category: 'Cybersecurity',
  },
  {
    icon: ShieldCheck,
    gradient: 'from-red-600 to-rose-700',
    title: 'Incident Response & Recovery',
    desc: 'Rapid incident response and recovery support to restore operations after a security breach.',
    tags: ['Incident Response', 'Recovery'],
    category: 'Cybersecurity',
  },
  // Web & Digital Presence
  {
    icon: Globe,
    gradient: 'from-blue-500 to-cyan-600',
    title: 'Web Design, Development & Hosting',
    desc: 'Modern, mobile-first websites built, hosted, and maintained for performance and reliability.',
    tags: ['Web Design', 'Development', 'Hosting'],
    category: 'Web & Digital',
  },
  {
    icon: Landmark,
    gradient: 'from-cyan-500 to-blue-600',
    title: 'Domain Registration & Management',
    desc: 'Domain registration, renewal, and DNS management handled end-to-end.',
    tags: ['Domains', 'DNS'],
    category: 'Web & Digital',
  },
  {
    icon: Search,
    gradient: 'from-sky-500 to-cyan-600',
    title: 'SEO, Landing Pages & Portfolios',
    desc: 'Search engine optimization, high-converting landing pages, and professional portfolios.',
    tags: ['SEO', 'Landing Pages', 'Portfolios'],
    category: 'Web & Digital',
  },
  {
    icon: ShoppingCart,
    gradient: 'from-blue-400 to-indigo-600',
    title: 'E-commerce Setup & Maintenance',
    desc: 'Full e-commerce store setup and ongoing maintenance so you can sell online with confidence.',
    tags: ['E-commerce', 'Maintenance'],
    category: 'Web & Digital',
  },
  // Social Media & Content
  {
    icon: Smartphone,
    gradient: 'from-fuchsia-500 to-pink-600',
    title: 'Social Media Account Management',
    desc: 'Account management and growth strategies that build real, engaged audiences.',
    tags: ['Management', 'Growth'],
    category: 'Social Media',
  },
  {
    icon: Palette,
    gradient: 'from-pink-500 to-rose-600',
    title: 'Graphics, Copy & Video Scripts',
    desc: 'Eye-catching graphics, persuasive copy, and video scripts that tell your brand story.',
    tags: ['Graphics', 'Copy', 'Scripts'],
    category: 'Social Media',
  },
  {
    icon: BarChart3,
    gradient: 'from-rose-500 to-fuchsia-600',
    title: 'Brand Strategy & Digital Marketing',
    desc: 'Brand strategy and digital marketing campaigns that drive measurable results.',
    tags: ['Strategy', 'Marketing'],
    category: 'Social Media',
  },
  {
    icon: Linkedin,
    gradient: 'from-sky-600 to-blue-700',
    title: 'LinkedIn Profile Optimization',
    desc: 'LinkedIn profile optimization that positions you as a credible professional and attracts opportunities.',
    tags: ['LinkedIn', 'Optimization'],
    category: 'Social Media',
  },
  // Admin & E-Correspondence
  {
    icon: FileText,
    gradient: 'from-emerald-500 to-teal-600',
    title: 'Professional Document Formatting',
    desc: 'Clean, professional document formatting for reports, proposals, and official correspondence.',
    tags: ['Formatting', 'Documents'],
    category: 'Admin & E-Correspondence',
  },
  {
    icon: Mail,
    gradient: 'from-teal-500 to-emerald-600',
    title: 'Email Management & Drafting',
    desc: 'Email management and professional drafting so your correspondence is always polished.',
    tags: ['Email', 'Drafting'],
    category: 'Admin & E-Correspondence',
  },
  {
    icon: Search,
    gradient: 'from-green-500 to-teal-600',
    title: 'Online Research & Data Compilation',
    desc: 'Thorough online research and structured data compilation for informed decision-making.',
    tags: ['Research', 'Data'],
    category: 'Admin & E-Correspondence',
  },
  {
    icon: Briefcase,
    gradient: 'from-emerald-600 to-green-700',
    title: 'Virtual Assistant & Secretarial',
    desc: 'Virtual assistant and secretarial support to keep your operations running smoothly.',
    tags: ['Virtual Assistant', 'Secretarial'],
    category: 'Admin & E-Correspondence',
  },
  {
    icon: FileCheck,
    gradient: 'from-teal-600 to-emerald-700',
    title: 'CV / Resume & Cover Letter Writing',
    desc: 'Modern, ATS-friendly CVs and persuasive cover letters that get you shortlisted.',
    tags: ['CV', 'Resume', 'Cover Letter'],
    category: 'Admin & E-Correspondence',
  },
  // Data & Cloud Services
  {
    icon: Cloud,
    gradient: 'from-sky-400 to-blue-500',
    title: 'Cloud Setup (Drive, OneDrive, Dropbox)',
    desc: 'Cloud storage setup and configuration across Google Drive, OneDrive, and Dropbox.',
    tags: ['Cloud', 'Drive', 'OneDrive'],
    category: 'Data & Cloud',
  },
  {
    icon: HardDrive,
    gradient: 'from-blue-500 to-sky-600',
    title: 'Data Backup & Recovery',
    desc: 'Reliable data backup and recovery solutions to safeguard what matters most.',
    tags: ['Backup', 'Recovery'],
    category: 'Data & Cloud',
  },
  {
    icon: Database,
    gradient: 'from-cyan-500 to-sky-600',
    title: 'Database Creation & File Archiving',
    desc: 'Custom database creation and organized file archiving for easy access and compliance.',
    tags: ['Database', 'Archiving'],
    category: 'Data & Cloud',
  },
  // Digital Skills Training
  {
    icon: Laptop,
    gradient: 'from-violet-500 to-purple-600',
    title: 'Computer Literacy & MS Office',
    desc: 'Practical computer literacy and MS Office training for all skill levels.',
    tags: ['Computer Literacy', 'MS Office'],
    category: 'Digital Skills',
  },
  {
    icon: Shield,
    gradient: 'from-purple-500 to-violet-600',
    title: 'Cyber Hygiene & Internet Safety',
    desc: 'Cyber hygiene and internet safety coaching to keep you and your family safe online.',
    tags: ['Cyber Hygiene', 'Safety'],
    category: 'Digital Skills',
  },
  {
    icon: Share2,
    gradient: 'from-fuchsia-500 to-purple-600',
    title: 'Professional Social Media Skills',
    desc: 'Professional social media skills training for personal branding and business growth.',
    tags: ['Social Media', 'Skills'],
    category: 'Digital Skills',
  },
  {
    icon: Award,
    gradient: 'from-violet-600 to-fuchsia-600',
    title: 'Digital Entrepreneurship Coaching',
    desc: 'Digital entrepreneurship coaching to help you launch and grow an online business.',
    tags: ['Entrepreneurship', 'Coaching'],
    category: 'Digital Skills',
  },
  // Government Compliance
  {
    icon: Building,
    gradient: 'from-amber-500 to-orange-600',
    title: 'Business & Company Registration',
    desc: 'Business and company registration handled from name search to certificate.',
    tags: ['Business', 'Company', 'Registration'],
    category: 'Government',
  },
  {
    icon: FileText,
    gradient: 'from-orange-500 to-amber-600',
    title: 'KRA PIN, iTax Setup & Returns',
    desc: 'KRA PIN registration, iTax setup, and timely returns filing for individuals and businesses.',
    tags: ['KRA', 'iTax', 'Returns'],
    category: 'Government',
  },
  {
    icon: ScrollText,
    gradient: 'from-amber-600 to-yellow-600',
    title: 'VAT & County Business Permits',
    desc: 'VAT registration and county business permit applications to keep you compliant.',
    tags: ['VAT', 'Permits'],
    category: 'Government',
  },
  {
    icon: Landmark,
    gradient: 'from-yellow-500 to-amber-600',
    title: 'NGO / CBO & ODPC Registration',
    desc: 'NGO, CBO, and ODPC (data protection) registration support for organizations.',
    tags: ['NGO', 'CBO', 'ODPC'],
    category: 'Government',
  },
  {
    icon: ShieldCheck,
    gradient: 'from-orange-600 to-red-500',
    title: 'SHA, NSSF & Annual Returns',
    desc: 'SHA, NSSF registration, and annual returns filing so you stay compliant year-round.',
    tags: ['SHA', 'NSSF', 'Returns'],
    category: 'Government',
  },
  {
    icon: FileCheck,
    gradient: 'from-amber-500 to-orange-700',
    title: 'e-Citizen Navigation & Tenders',
    desc: 'e-Citizen navigation and tender application support to access government opportunities.',
    tags: ['e-Citizen', 'Tenders'],
    category: 'Government',
  },
  // Student Support
  {
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-600',
    title: 'Academic Research, Reports & Essays',
    desc: 'Academic research, reports, and essays crafted to high scholarly standards.',
    tags: ['Research', 'Reports', 'Essays'],
    category: 'Student Support',
  },
  {
    icon: FileText,
    gradient: 'from-indigo-500 to-blue-600',
    title: 'Thesis / Dissertation Formatting',
    desc: 'Thesis and dissertation formatting that meets your institution’s exact requirements.',
    tags: ['Thesis', 'Dissertation'],
    category: 'Student Support',
  },
  {
    icon: PenTool,
    gradient: 'from-cyan-500 to-blue-600',
    title: 'Typing, Editing & PPT Presentations',
    desc: 'Typing, editing, and professional PowerPoint presentations delivered fast.',
    tags: ['Typing', 'Editing', 'PPT'],
    category: 'Student Support',
  },
  {
    icon: GraduationCap,
    gradient: 'from-blue-600 to-cyan-700',
    title: 'University, Scholarship & HELB Apps',
    desc: 'University, scholarship, and HELB application support so you never miss a deadline.',
    tags: ['University', 'Scholarship', 'HELB'],
    category: 'Student Support',
  },
  {
    icon: Laptop,
    gradient: 'from-sky-500 to-indigo-600',
    title: 'Student Portals & LMS Navigation',
    desc: 'Student portal and LMS navigation help for seamless online learning access.',
    tags: ['Portals', 'LMS'],
    category: 'Student Support',
  },
  {
    icon: Briefcase,
    gradient: 'from-indigo-600 to-blue-700',
    title: 'Internship Letters & Career Guidance',
    desc: 'Internship letters and career guidance to help you take the next step with confidence.',
    tags: ['Internship', 'Career'],
    category: 'Student Support',
  },
  {
    icon: Palette,
    gradient: 'from-pink-500 to-rose-600',
    title: 'Logo & Brand Identity Design',
    desc: 'Professional logos and complete brand identity kits that make your business unforgettable.',
    tags: ['Logo', 'Branding'],
    category: 'Creative & Design',
  },
  {
    icon: Image,
    gradient: 'from-orange-500 to-red-500',
    title: 'Flyer, Poster & Banner Design',
    desc: 'Eye-catching marketing materials for events, promotions, and campaigns.',
    tags: ['Flyer', 'Poster'],
    category: 'Creative & Design',
  },
  {
    icon: CreditCard,
    gradient: 'from-teal-500 to-cyan-600',
    title: 'Business Card & Letterhead Design',
    desc: 'Professional stationery design that leaves a lasting impression.',
    tags: ['Cards', 'Stationery'],
    category: 'Creative & Design',
  },
  {
    icon: Camera,
    gradient: 'from-violet-500 to-fuchsia-600',
    title: 'Photo Editing & Retouching',
    desc: 'Professional photo editing, background removal, and retouching services.',
    tags: ['Photos', 'Editing'],
    category: 'Creative & Design',
  },
  {
    icon: Code,
    gradient: 'from-blue-600 to-indigo-700',
    title: 'Mobile App Development',
    desc: 'Custom mobile apps for Android and iOS — from concept to app store.',
    tags: ['Android', 'iOS'],
    category: 'Mobile & App',
  },
  {
    icon: Smartphone,
    gradient: 'from-cyan-500 to-blue-600',
    title: 'App Bug Fixing & Maintenance',
    desc: 'Fix crashes, bugs, and performance issues in your existing mobile or web app.',
    tags: ['Bug Fix', 'Maintenance'],
    category: 'Mobile & App',
  },
];

const categories = ['All', 'Cybersecurity', 'Web & Digital', 'Social Media', 'Admin & E-Correspondence', 'Data & Cloud', 'Digital Skills', 'Government', 'Student Support', 'Creative & Design', 'Mobile & App'];

const categoryMeta: Record<string, { label: string; color: string }> = {
  All: { label: 'All Services', color: 'from-gray-700 to-gray-900' },
  Cybersecurity: { label: 'Cybersecurity', color: 'from-red-500 to-rose-600' },
  'Web & Digital': { label: 'Web & Digital Presence', color: 'from-blue-500 to-cyan-600' },
  'Social Media': { label: 'Social Media & Content', color: 'from-fuchsia-500 to-pink-600' },
  'Admin & E-Correspondence': { label: 'Admin & E-Correspondence', color: 'from-emerald-500 to-teal-600' },
  'Data & Cloud': { label: 'Data & Cloud Services', color: 'from-sky-400 to-blue-500' },
  'Digital Skills': { label: 'Digital Skills Training', color: 'from-violet-500 to-purple-600' },
  Government: { label: 'Government Compliance', color: 'from-amber-500 to-orange-600' },
  'Student Support': { label: 'Student Support', color: 'from-blue-500 to-indigo-600' },
  'Creative & Design': { label: 'Creative & Design', color: 'from-pink-500 to-rose-600' },
  'Mobile & App': { label: 'Mobile & App', color: 'from-blue-600 to-indigo-700' },
};

function ServiceCard({ service, index, onBookNow }: { service: Service; index: number; onBookNow: (service: string) => void }) {
  const { ref, inView } = useInView();
  const Icon = service.icon;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`group relative bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity pointer-events-none rounded-2xl`} />
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.desc}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {service.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={() => onBookNow(service.title)}
        className={`flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}
      >
        Book Now <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
      </button>
    </div>
  );
}

export default function Services({ onBookNow }: { onBookNow: (service: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const headerRef = useRef<HTMLDivElement>(null);
  const { ref: titleRef, inView: titleInView } = useInView();

  const filtered = services.filter((s) => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const q = search.toLowerCase();
    return matchCat && (s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)));
  });

  return (
    <section id="services" className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          ref={titleRef as React.RefObject<HTMLDivElement>}
          className={`text-center max-w-2xl mx-auto mb-12 transition-all duration-700 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Our Services
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Your All-in-One Digital Services Center
          </h2>
          <p className="text-gray-500 text-lg">
            Professional, confidential, and affordable tech, administrative, and compliance solutions across Kenya &amp; beyond.
          </p>
        </div>

        {/* Search */}
        <div className={`relative max-w-md mx-auto mb-8 transition-all duration-700 delay-150 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Category tabs */}
        <div className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-700 delay-200 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat
                  ? `bg-gradient-to-r ${categoryMeta[cat].color} text-white shadow-md scale-105`
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-cyan-300 hover:text-cyan-600'
              }`}
            >
              {categoryMeta[cat].label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} onBookNow={onBookNow} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No services found. Try a different search.</p>
          </div>
        )}

        {/* CTA banner */}
        <div className={`mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#071524] to-[#0d2137] flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-700 delay-300 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          ref={headerRef}
        >
          <div className="text-center md:text-left">
            <h3 className="text-white font-bold text-xl mb-1">Not sure which service you need?</h3>
            <p className="text-gray-400 text-sm">Chat with us on WhatsApp and we will guide you — free consultation.</p>
          </div>
          <a
            href="https://wa.me/254717171184"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 bg-green-500 text-white rounded-full font-bold hover:bg-green-400 hover:scale-105 transition-all shadow-lg"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

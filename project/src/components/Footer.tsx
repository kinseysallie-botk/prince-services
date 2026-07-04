import { GraduationCap, MessageCircle, Twitter, Facebook, Instagram, Linkedin, Youtube, ArrowRight, ExternalLink } from 'lucide-react';

const footerLinks = {
  'Education Services': [
    'HELB Applications',
    'KUCCPS Placement',
    'KMTC & TVET',
    'University Transfers',
    'Scholarships & Bursaries',
  ],
  'Government Services': [
    'KRA PIN & Returns',
    'SHA / NHIF Registration',
    'Certificate of Good Conduct',
    'NSSF & NTSA',
    'Business Registration',
  ],
  'Creative & Academic': [
    'CV & Cover Letters',
    'Graphic Design',
    'Web Design & Hosting',
    'Academic Writing',
    'Cybersecurity',
  ],
  Resources: [
    'Free Library',
    'WhatsApp Group',
    'Donate',
    'Admin Panel',
  ],
};

const socials = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
  { icon: MessageCircle, href: 'https://wa.me/254717171184', label: 'WhatsApp' },
];

export default function Footer() {
  return (
    <footer className="bg-[#071524] text-gray-300">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-xl mb-1">Stay in the loop</h3>
              <p className="text-gray-400 text-sm">Get KUCCPS/HELB updates, tax deadlines, and service tips weekly.</p>
            </div>
            <div className="flex w-full max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-l-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-r-xl font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-1.5">
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp group highlight */}
      <div className="border-b border-white/10 bg-green-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-300">
            <span className="font-bold text-white">Young Minds || Bold Vision || United Africa</span> &mdash;
            Join our official KUCCPS &amp; HELB Updates Group 2026/2027
          </p>
          <a
            href="https://chat.whatsapp.com/JdKso7FdIRG4rNGSAqyJ6c?s=cl&p=a&mlu=2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-400 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Join WhatsApp Group
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-white text-base leading-none">Prince Services</div>
                <div className="text-[9px] font-semibold text-cyan-400 tracking-widest mt-0.5">PROFESSIONAL SOLUTIONS</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              Your one-stop KUCCPS &amp; HELB Service Centre. Fast, reliable, affordable digital services.
            </p>
            <div className="text-sm text-gray-400 mb-1">
              <span className="text-cyan-400 font-semibold">+254 717 171 184</span>
            </div>
            <div className="text-sm text-gray-400 mb-5">
              <a href="mailto:princetyler825@gmail.com" className="hover:text-cyan-400 transition-colors">
                princetyler825@gmail.com
              </a>
            </div>
            <div className="flex gap-2 flex-wrap">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:bg-cyan-500 hover:text-white transition-all hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-bold text-xs mb-4 uppercase tracking-wider">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (link === 'Admin Panel') { window.location.hash = 'admin'; return; }
                        if (link === 'Free Library') { window.location.hash = 'library'; return; }
                        if (link === 'WhatsApp Group') { window.open('https://chat.whatsapp.com/JdKso7FdIRG4rNGSAqyJ6c?s=cl&p=a&mlu=2', '_blank'); return; }
                        const el = document.getElementById(link.toLowerCase().split(' ')[0].replace('&', ''));
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-gray-400 text-sm hover:text-cyan-400 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Prince Services. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            Making Online Services Simple &bull; Meru, Kenya
          </div>
        </div>
      </div>
    </footer>
  );
}

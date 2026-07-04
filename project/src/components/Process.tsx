import { MessageCircle, ClipboardList, Cpu, CheckCircle } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const steps = [
  { number: '01', icon: MessageCircle, color: 'from-cyan-500 to-blue-600', title: 'Contact Us', desc: 'Reach out via WhatsApp (+254 717 171 184) or fill the booking form. Tell us what you need in plain language.' },
  { number: '02', icon: ClipboardList, color: 'from-blue-500 to-indigo-600', title: 'Get a Custom Quote', desc: 'We assess your needs and provide a clear, transparent quote. No hidden charges. No obligation.' },
  { number: '03', icon: Cpu, color: 'from-indigo-500 to-purple-600', title: 'We Handle Everything', desc: 'Our specialists get to work immediately. You get real-time updates via WhatsApp throughout the process.' },
  { number: '04', icon: CheckCircle, color: 'from-green-500 to-emerald-600', title: 'Delivery & Support', desc: 'Receive your completed service, request free revisions if needed, and enjoy ongoing WhatsApp support.' },
];

export default function Process() {
  const { ref, inView } = useInView();

  return (
    <section id="process" className="py-24 bg-gradient-to-br from-[#071524] via-[#0d2137] to-[#0a1e35] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #00d4c8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-cyan-500/30">
            How It Works
          </span>
          <h2 className="text-4xl font-extrabold text-white mb-4">Simple, stress-free process</h2>
          <p className="text-gray-400 text-lg">Getting started takes less than 5 minutes. Here is exactly what to expect.</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-16 left-1/2 -translate-x-1/2 w-[calc(100%-200px)] h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-400/40 to-green-500/20" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ number, icon: Icon, color, title, desc }, i) => (
              <div
                key={number}
                className={`relative text-center group transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="text-xs font-bold text-gray-600 mb-3 tracking-widest">{number}</div>
                <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`text-center mt-16 transition-all duration-700 delay-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a
            href="https://wa.me/254717171184"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full font-bold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
          >
            <MessageCircle className="w-5 h-5" /> Start Your Service Now
          </a>
        </div>
      </div>
    </section>
  );
}

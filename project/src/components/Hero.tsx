import { useEffect, useRef, useState } from 'react';
import { Shield, Globe, FileText, BookOpen, ChevronRight, MessageCircle, ArrowRight, GraduationCap, Users } from 'lucide-react';

const quickServices = [
  { icon: GraduationCap, color: 'bg-blue-600', name: 'KUCCPS & HELB', desc: 'Applications & placement guidance' },
  { icon: FileText, color: 'bg-green-500', name: 'KRA PIN & Returns', desc: 'Tax compliance made easy' },
  { icon: Shield, color: 'bg-rose-500', name: 'Cybersecurity', desc: 'Protect your digital assets' },
  { icon: Globe, color: 'bg-cyan-600', name: 'Web Design & Hosting', desc: 'Professional web presence' },
  { icon: BookOpen, color: 'bg-orange-500', name: 'Academic Writing', desc: 'Research & assignments help' },
  { icon: Users, color: 'bg-violet-600', name: 'CV & Career Services', desc: 'Land your dream job' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(start);
        }, 20);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="text-2xl font-extrabold text-white">{count}{suffix}</div>;
}

export default function Hero() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollToServices = () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  const openBooking = () => {
    window.dispatchEvent(new CustomEvent('open-booking'));
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#071524] via-[#0d2137] to-[#0a1e35] overflow-hidden pt-16">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #00d4c8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div className="space-y-8">
            <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-cyan-500/40 rounded-full text-xs font-semibold text-cyan-400 bg-cyan-500/10 backdrop-blur-sm mb-6">
                <span className="w-4 h-4 border-2 border-cyan-400 rounded-full flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                </span>
                TRUSTED BY 500+ STUDENTS &amp; PROFESSIONALS
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-white">
                Your one-stop
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 underline decoration-cyan-400/60 underline-offset-4">
                  cyber services
                </span>
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-white">
                hub
              </h1>
            </div>

            <p className={`text-gray-300 text-lg leading-relaxed max-w-xl transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Professional support for KUCCPS, HELB, KRA compliance, cybersecurity, web development, and student services.
              We make online services <span className="text-cyan-400 font-semibold">simple, fast, and reliable</span>.
            </p>

            <div className={`flex flex-wrap gap-4 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <button
                onClick={openBooking}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 hover:scale-105 transition-all"
              >
                Book Now <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToServices}
                className="flex items-center gap-2 px-6 py-3.5 border border-white/20 text-white rounded-full font-semibold hover:bg-white/10 hover:border-white/40 transition-all"
              >
                Explore Services
              </button>
            </div>

            <div className={`flex gap-8 pt-2 transition-all duration-700 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div>
                <AnimatedCounter target={500} suffix="+" />
                <div className="text-sm text-gray-400 mt-0.5">Happy Clients</div>
              </div>
              <div>
                <AnimatedCounter target={14} suffix="+" />
                <div className="text-sm text-gray-400 mt-0.5">Services</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">24/7</div>
                <div className="text-sm text-gray-400 mt-0.5">Support</div>
              </div>
            </div>
          </div>

          {/* Right: Quick Booking */}
          <div className={`flex justify-center lg:justify-end transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="w-full max-w-sm">
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">Quick Booking</h3>
                    <p className="text-gray-400 text-sm mt-0.5">Popular services at your fingertips</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-semibold">Live</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {quickServices.map(({ icon: Icon, color, name, desc }, i) => (
                    <button
                      key={name}
                      onClick={scrollToServices}
                      className="w-full flex items-center gap-3.5 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all group"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4.5 h-4.5 text-white w-5 h-5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-white text-xs font-semibold truncate">{name}</div>
                        <div className="text-gray-400 text-xs">{desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={scrollToServices}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all"
                >
                  View All 14+ Services
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat floating button */}
      <a
        href="https://wa.me/254717171184"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-5 py-3.5 bg-green-500 text-white rounded-full shadow-xl shadow-green-500/40 hover:bg-green-400 hover:scale-105 transition-all font-semibold text-sm animate-bounce-slow"
      >
        <MessageCircle className="w-5 h-5" /> Chat with us
      </a>
    </section>
  );
}

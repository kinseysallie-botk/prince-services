import { CheckCircle, Clock, Shield, Award, HeartHandshake, Zap } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const reasons = [
  { icon: Shield, color: 'text-cyan-500', bg: 'bg-cyan-50', title: 'Trusted & Verified', desc: 'Over 500 happy clients trust us. Transparent, accountable, confidential.' },
  { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Fast Turnaround', desc: 'Most services delivered within 24 hours. Urgent requests in under 1 hour.' },
  { icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Expert Specialists', desc: 'Experienced specialists in HELB, KUCCPS, KRA, cybersecurity and more.' },
  { icon: HeartHandshake, color: 'text-rose-500', bg: 'bg-rose-50', title: '24/7 WhatsApp Support', desc: 'Real human support. We walk with you through every step — no bots.' },
  { icon: Zap, color: 'text-green-500', bg: 'bg-green-50', title: 'Student-Friendly Prices', desc: 'Premium quality at prices every Kenyan student can afford.' },
  { icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50', title: 'Satisfaction Guaranteed', desc: 'Not happy? We revise until you are — that is our commitment to you.' },
];

export default function WhyUs() {
  const { ref: sectionRef, inView } = useInView();

  return (
    <section id="why-us" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={sectionRef as React.RefObject<HTMLDivElement>}
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left */}
          <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="inline-block px-4 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
              We are not just a service — we are your digital partner
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Prince Services was founded with one mission: make professional digital support accessible, affordable, and reliable for every Kenyan student and professional.
            </p>
            <div className="space-y-3">
              {[
                '100% confidentiality guaranteed',
                'No hidden fees or surprises',
                'Serving students across Kenya and beyond',
                'Rated highly by our growing community',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-gray-900">Contact: </span>
                <a href="https://wa.me/254717171184" className="text-cyan-600 font-semibold hover:underline">+254 717 171 184</a>
                {' '}&bull;{' '}
                <a href="mailto:princetyler825@gmail.com" className="text-cyan-600 font-semibold hover:underline">princetyler825@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Right grid */}
          <div className={`grid sm:grid-cols-2 gap-5 transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            {reasons.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <div
                key={title}
                className="group p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

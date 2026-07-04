import { MessageCircle, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useInView } from '../hooks/useInView';

const contactInfo = [
  {
    icon: MessageCircle,
    color: 'bg-green-500',
    label: 'WhatsApp',
    value: '+254 717 171 184',
    href: 'https://wa.me/254717171184',
  },
  {
    icon: Mail,
    color: 'bg-blue-500',
    label: 'Email',
    value: 'princetyler825@gmail.com',
    href: 'mailto:princetyler825@gmail.com',
  },
  {
    icon: Phone,
    color: 'bg-cyan-500',
    label: 'Phone',
    value: '+254 751 332 163',
    href: 'tel:+254751332163',
  },
  {
    icon: MapPin,
    color: 'bg-rose-500',
    label: 'Location',
    value: 'Meru, Meru Kenya',
    href: '#',
  },
];

export default function Contact() {
  const { ref, inView } = useInView();

  return (
    <section id="contact" className="py-24 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center max-w-2xl mx-auto mb-14 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Contact Us
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Get in touch
          </h2>
          <p className="text-gray-500 text-lg">
            Reach us on WhatsApp, phone, or email. We typically respond within 30 minutes.
          </p>
        </div>

        <div className={`max-w-3xl mx-auto space-y-4 transition-all duration-700 delay-150 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {contactInfo.map(({ icon: Icon, color, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 hover:border-cyan-200 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">{label}</div>
                <div className="text-gray-800 font-semibold text-base group-hover:text-cyan-600 transition-colors">{value}</div>
              </div>
            </a>
          ))}

          {/* WhatsApp group */}
          <a
            href="https://chat.whatsapp.com/JdKso7FdIRG4rNGSAqyJ6c?s=cl&p=a&mlu=2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-[1.01] transition-all group"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-green-100 font-medium">Official WhatsApp Group</div>
              <div className="font-bold text-base">KUCCPS &amp; HELB Updates 2026/2027</div>
            </div>
          </a>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-cyan-50 border border-cyan-100">
            <p className="text-gray-600 text-sm leading-relaxed">
              <span className="font-bold text-gray-900">Young Minds || Bold Vision || United Africa</span><br />
              Making online services simple for every Kenyan student and professional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

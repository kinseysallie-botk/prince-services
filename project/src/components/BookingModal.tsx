import { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle, AlertCircle, User, Phone, Mail, FileText, MessageSquare, Share2, MessageCircle, Clock, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getServiceInfo } from '../lib/serviceCatalog';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  preselectedService?: string;
}

const services = [
  // Cybersecurity
  'Cybersecurity Training & Consulting', 'Ethical Hacking & Pentesting',
  'Network Monitoring & Assessments', 'Data Protection & VPN Setup',
  'Incident Response & Recovery',
  // Web & Digital Presence
  'Web Design, Development & Hosting', 'Domain Registration & Management',
  'SEO, Landing Pages & Portfolios', 'E-commerce Setup & Maintenance',
  // Social Media & Content
  'Social Media Account Management', 'Graphics, Copy & Video Scripts',
  'Brand Strategy & Digital Marketing', 'LinkedIn Profile Optimization',
  // Admin & E-Correspondence
  'Professional Document Formatting', 'Email Management & Drafting',
  'Online Research & Data Compilation', 'Virtual Assistant & Secretarial',
  'CV / Resume & Cover Letter Writing',
  // Data & Cloud Services
  'Cloud Setup (Drive, OneDrive, Dropbox)', 'Data Backup & Recovery',
  'Database Creation & File Archiving',
  // Digital Skills Training
  'Computer Literacy & MS Office', 'Cyber Hygiene & Internet Safety',
  'Professional Social Media Skills', 'Digital Entrepreneurship Coaching',
  // Government Compliance
  'Business & Company Registration', 'KRA PIN, iTax Setup & Returns',
  'VAT & County Business Permits', 'NGO / CBO & ODPC Registration',
  'SHA, NSSF & Annual Returns', 'e-Citizen Navigation & Tenders',
  // Student Support
  'Academic Research, Reports & Essays', 'Thesis / Dissertation Formatting',
  'Typing, Editing & PPT Presentations', 'University, Scholarship & HELB Apps',
  'Student Portals & LMS Navigation', 'Internship Letters & Career Guidance',
  // Creative & Design
  'Logo & Brand Identity Design', 'Flyer, Poster & Banner Design',
  'Business Card & Letterhead Design', 'Photo Editing & Retouching',
  // Mobile & App
  'Mobile App Development', 'App Bug Fixing & Maintenance',
  'Other',
];

export default function BookingModal({ open, onClose, preselectedService }: BookingModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: preselectedService || '', message: '' });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [shared, setShared] = useState(false);

  const serviceInfo = form.service ? getServiceInfo(form.service) : null;

  // When the modal opens with a preselected service, ensure the form is synced
  useEffect(() => {
    if (open && preselectedService) {
      setForm((prev) => {
        if (prev.service === preselectedService) return prev;
        const info = getServiceInfo(preselectedService);
        return { ...prev, service: preselectedService, message: info?.autoMessage || prev.message };
      });
      setAnswers({});
    }
  }, [open, preselectedService]);

  // When service changes (user picks from dropdown), auto-fill the message
  useEffect(() => {
    if (!form.service) return;
    const info = getServiceInfo(form.service);
    setForm((prev) => {
      const prevInfo = prev.service ? getServiceInfo(prev.service) : null;
      const shouldReplace = !prev.message || (prevInfo && prev.message === prevInfo.autoMessage);
      return { ...prev, message: shouldReplace ? info.autoMessage : prev.message };
    });
    setAnswers({});
  }, [form.service]);

  if (!open) return null;

  const formatPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 9);
    return `+254 ${digits.slice(0, 3)}${digits.slice(3, 6) ? ' ' + digits.slice(3, 6) : ''}${digits.slice(6, 9) ? ' ' + digits.slice(6, 9) : ''}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 12 || !digits.startsWith('254')) {
      setError('Please enter a valid Kenyan phone number starting with +254.');
      setLoading(false);
      return;
    }

    // Validate required questions
    if (serviceInfo) {
      for (const q of serviceInfo.questions) {
        if (q.required && !answers[q.id]?.trim()) {
          setError(`Please answer: ${q.label}`);
          setLoading(false);
          return;
        }
      }
    }

    // Build an enriched message that includes the question answers
    let enrichedMessage = form.message;
    if (serviceInfo && serviceInfo.questions.length > 0) {
      const answerLines = serviceInfo.questions
        .map((q) => {
          const ans = answers[q.id]?.trim();
          if (!ans) return null;
          return `  • ${q.label}: ${ans}`;
        })
        .filter(Boolean);
      if (answerLines.length > 0) {
        enrichedMessage = `${form.message}\n\nMy details:\n${answerLines.join('\n')}`;
      }
    }

    const { data: insertData, error: dbError } = await supabase
      .from('bookings')
      .insert({
        name: form.name,
        email: form.email || null,
        phone: form.phone,
        service: form.service || 'General Enquiry',
        message: enrichedMessage || null,
        user_id: user?.id || null,
      });

    setLoading(false);

    const data = Array.isArray(insertData) ? insertData[0] : insertData;

    if (dbError || !data) {
      setError('Could not submit your booking. Please try again.');
      return;
    }

    setBookingRef(`PS-${data.id.slice(0, 8).toUpperCase()}`);
    setSuccess(true);
    setShared(false);

    // Fire-and-forget: send Gmail notification to the business owner
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-booking`;
      await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          booking_id: data.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          service: form.service || 'General Enquiry',
          message: enrichedMessage,
        }),
      });
    } catch {
      // Notification failure should not block the user's booking confirmation
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setForm({ name: '', email: '', phone: '', service: preselectedService || '', message: '' });
    setAnswers({});
    setBookingRef('');
    setShared(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#071524] to-[#0d2137] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h3 className="text-white font-bold text-lg">Book a Service</h3>
              <p className="text-gray-400 text-xs mt-0.5">Fill in your details and we will contact you within 30 minutes</p>
            </div>
            <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce-once">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Received!</h3>
              <div className="inline-block bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-4">
                <p className="text-xs text-gray-400 font-medium">Booking Reference</p>
                <p className="text-lg font-extrabold text-cyan-700 tracking-wider">{bookingRef}</p>
              </div>
              <p className="text-gray-500 text-sm mb-1">
                Thank you, <strong>{form.name}</strong>! Your request for <strong>{form.service}</strong> has been received.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                We will contact you on <strong>{form.phone}</strong> via WhatsApp.
              </p>

              {/* WhatsApp share prompt */}
              <div className={`mb-6 p-4 rounded-2xl border transition-all ${shared ? 'bg-green-50 border-green-200' : 'bg-cyan-50 border-cyan-200'}`}>
                <div className="flex items-start gap-3 text-left">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${shared ? 'bg-green-500' : 'bg-cyan-500'}`}>
                    {shared ? <CheckCircle className="w-5 h-5 text-white" /> : <Share2 className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      {shared ? 'Shared on WhatsApp!' : 'Share your booking on WhatsApp'}
                    </p>
                    <p className="text-gray-500 text-xs mb-3">
                      {shared
                        ? 'Your booking details have been sent. We will respond within 30 minutes.'
                        : 'Send your booking details directly to us on WhatsApp for a faster response.'}
                    </p>
                    <a
                      href={`https://wa.me/254717171184?text=${encodeURIComponent(`Hello Prince Services,\n\nI just submitted a booking with the following details:\n\n*Booking Ref:* ${bookingRef}\n*Name:* ${form.name}\n*Phone:* ${form.phone}\n*Service:* ${form.service}${form.message ? `\n*Details:* ${form.message}` : ''}\n\nPlease assist. Thank you!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => setShared(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full font-semibold hover:bg-green-400 transition-all text-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {shared ? 'Open WhatsApp again' : 'Share on WhatsApp'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleClose} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-full font-semibold hover:border-cyan-300 hover:text-cyan-600 transition-all text-sm">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone (+254) *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel" required value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Required *</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    required value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white appearance-none"
                  >
                    <option value="">Select a service...</option>
                    {services.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Service-specific questions */}
              {serviceInfo && serviceInfo.questions.length > 0 && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-600" />
                    <p className="text-sm font-bold text-gray-800">A few questions about your request</p>
                  </div>
                  {serviceInfo.turnaround && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 border border-gray-200">
                      <Clock className="w-3.5 h-3.5 text-blue-500" /> {serviceInfo.turnaround}
                    </span>
                  )}

                  <div className="space-y-3">
                    {serviceInfo.questions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          {q.label} {q.required && <span className="text-red-500">*</span>}
                        </label>
                        {q.hint && <p className="text-xs text-gray-400 mb-1.5">{q.hint}</p>}
                        {q.type === 'select' && q.options ? (
                          <select
                            value={answers[q.id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                          >
                            <option value="">Select...</option>
                            {q.options.map((opt) => <option key={opt}>{opt}</option>)}
                          </select>
                        ) : q.type === 'textarea' ? (
                          <textarea
                            rows={2} value={answers[q.id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            placeholder="Type your answer..."
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                          />
                        ) : (
                          <input
                            type="text" value={answers[q.id] || ''}
                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                            placeholder="Type your answer..."
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Details</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-4 w-4 h-4 text-gray-400" />
                  <textarea
                    rows={3} value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us more about what you need..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  />
                </div>
                {serviceInfo && (
                  <p className="text-xs text-cyan-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Message auto-filled for this service — edit if needed.
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4" />Book Service Now</>}
              </button>

              <p className="text-center text-xs text-gray-400">
                We will contact you on WhatsApp within 30 minutes &bull; 100% confidential
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

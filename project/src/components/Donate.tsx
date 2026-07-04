import { useState, useEffect, useCallback } from 'react';
import { Heart, Smartphone, Copy, CheckCircle, Loader2, X, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { useAuth } from '../hooks/useAuth';
import { supabase, Donation } from '../lib/supabase';

const TILL_NUMBER = '6827632';

const donationAmounts = [
  { value: 100, label: 'KSH 100' },
  { value: 300, label: 'KSH 300' },
  { value: 500, label: 'KSH 500' },
  { value: 1000, label: 'KSH 1,000' },
  { value: 2000, label: 'KSH 2,000' },
  { value: 5000, label: 'KSH 5,000' },
];

export default function Donate() {
  const [copied, setCopied] = useState(false);
  const { ref, inView } = useInView();
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationForm, setDonationForm] = useState({ name: '', email: '', phone: '', amount: '', mpesa_code: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const fetchDonations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setDonations((data as Donation[]) || []);
  }, [user]);

  useEffect(() => { if (user) fetchDonations(); }, [user, fetchDonations]);

  const copyTill = async () => {
    await navigator.clipboard.writeText(TILL_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setDonationForm({ ...donationForm, amount: amount.toString() });
  };

  const handleDonateClick = () => {
    setShowDonationForm(true);
  };

  const submitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const userId = user?.id || null;
    const { data } = await supabase.from('donations').insert({
      user_id: userId,
      name: donationForm.name || null,
      email: donationForm.email || null,
      phone: donationForm.phone || null,
      amount: Number(donationForm.amount),
      mpesa_code: donationForm.mpesa_code || null,
      note: donationForm.note || null,
    }).select('*').maybeSingle();
    setSaving(false);
    if (data) {
      setDonations([data as Donation, ...donations]);
      setDonationForm({ name: '', email: '', phone: '', amount: '', mpesa_code: '', note: '' });
      setSelectedAmount(null);
      setShowDonationForm(false);
    }
  };

  const formatPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('254')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 9);
    return `+254 ${digits.slice(0, 3)}${digits.slice(3, 6) ? ' ' + digits.slice(3, 6) : ''}${digits.slice(6, 9) ? ' ' + digits.slice(6, 9) : ''}`.trim();
  };

  return (
    <section id="donate" className="py-24 bg-gradient-to-br from-rose-50 via-pink-50 to-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center max-w-xl mx-auto mb-14 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-2xl mb-5">
            <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <span className="inline-block px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Support Our Mission
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Fuel a student's future
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Every shilling you give turns into a door opened — a university application submitted, a HELB
            appeal won, a young mind empowered. You are not just donating; you are building the next
            generation of doctors, engineers, teachers, and leaders. Stand with us.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 gap-10 transition-all duration-700 delay-150 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Animated Heart with Till Number */}
          <div className="bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="w-6 h-6" />
                <span className="font-bold text-lg">Donate via M-Pesa</span>
              </div>
              <p className="text-rose-100 text-sm">Lipa Na M-Pesa — Till Number</p>
            </div>

            <div className="p-6">
              {/* Animated Heart with Till Number */}
              <div className="relative flex flex-col items-center justify-center py-8">
                <div className="relative">
                  {/* Outer pulsing rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-rose-200 animate-ping opacity-30" style={{ animationDuration: '2s' }} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-rose-300 animate-ping opacity-20" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                  </div>

                  {/* Heart container */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <Heart className="w-12 h-12 text-white animate-pulse" fill="white" />
                  </div>
                </div>

                {/* Till Number below heart */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Till Number</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-wider">{TILL_NUMBER}</span>
                    <button
                      onClick={copyTill}
                      className={`p-2 rounded-xl transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600'}`}
                      title="Copy till number"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {copied && <p className="text-green-600 text-xs mt-1 font-medium">Copied!</p>}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2 mt-4 border-t border-gray-100 pt-4">
                {[
                  'Go to M-Pesa on your phone',
                  'Select Lipa Na M-Pesa',
                  'Select Buy Goods & Services',
                  `Enter Till Number: ${TILL_NUMBER}`,
                  'Enter amount and your name',
                  'Confirm with your PIN',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-gray-700 text-sm">{step}</p>
                  </div>
                ))}
              </div>

              {/* Donate Button */}
              <button
                onClick={handleDonateClick}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.01] transition-all"
              >
                <Heart className="w-4 h-4" fill="white" /> Donate Now
              </button>
            </div>
          </div>

          {/* Right Column - Donation Form or Recent Donations */}
          <div className="flex flex-col gap-6">
            {/* Donation Form */}
            {showDonationForm && (
              <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Complete Your Donation</h3>
                  <button onClick={() => setShowDonationForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={submitDonation} className="space-y-4">
                  {/* Amount Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Amount *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {donationAmounts.map((amt) => (
                        <button
                          key={amt.value}
                          type="button"
                          onClick={() => handleAmountSelect(amt.value)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                            selectedAmount === amt.value
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-600'
                          }`}
                        >
                          {amt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Or Enter Custom Amount (KSH)</label>
                    <input
                      type="number"
                      min="1"
                      value={donationForm.amount}
                      onChange={(e) => {
                        setDonationForm({ ...donationForm, amount: e.target.value });
                        setSelectedAmount(null);
                      }}
                      placeholder="Enter amount"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={donationForm.name}
                        onChange={(e) => setDonationForm({ ...donationForm, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone (+254) *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={donationForm.phone}
                        onChange={(e) => setDonationForm({ ...donationForm, phone: formatPhone(e.target.value) })}
                        placeholder="+254 7XX XXX XXX"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={donationForm.email}
                        onChange={(e) => setDonationForm({ ...donationForm, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  </div>

                  {/* M-Pesa Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">M-Pesa Transaction Code</label>
                    <input
                      type="text"
                      value={donationForm.mpesa_code}
                      onChange={(e) => setDonationForm({ ...donationForm, mpesa_code: e.target.value })}
                      placeholder="e.g. QGH7X9AB12"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message (optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        rows={2}
                        value={donationForm.note}
                        onChange={(e) => setDonationForm({ ...donationForm, note: e.target.value })}
                        placeholder="Leave a message..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 transition-all disabled:opacity-60"
                  >
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Heart className="w-4 h-4" fill="white" /> Submit Donation</>}
                  </button>
                </form>
              </div>
            )}

            {/* Recent Donations */}
            {user && donations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Your Recent Donations</h3>
                <div className="space-y-2">
                  {donations.slice(0, 3).map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">KSH {Number(d.amount).toLocaleString()}</div>
                        {d.mpesa_code && <div className="text-xs text-gray-400 font-mono">{d.mpesa_code}</div>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {d.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Group CTA */}
            <div className="bg-gradient-to-br from-[#071524] to-[#0d2137] rounded-2xl p-6 text-white">
              <div className="text-2xl mb-2">&#128106;</div>
              <h3 className="font-bold text-lg mb-1">Join Our Official Group</h3>
              <p className="text-gray-400 text-sm mb-4">
                Get KUCCPS &amp; HELB updates 2026/2027. Young Minds || Bold Vision || United Africa.
              </p>
              <a
                href="https://chat.whatsapp.com/JdKso7FdIRG4rNGSAqyJ6c?s=cl&p=a&mlu=2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-400 hover:scale-105 transition-all w-fit"
              >
                <Heart className="w-4 h-4" fill="white" /> Join WhatsApp Group
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export interface ServiceQuestion {
  id: string;
  label: string;
  hint?: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

export interface ServiceInfo {
  name: string;
  category: string;
  turnaround?: string;
  questions: ServiceQuestion[];
  autoMessage: string;
}

export const serviceCatalog: Record<string, ServiceInfo> = {
  // ── Cybersecurity ──
  'Cybersecurity Training & Consulting': {
    name: 'Cybersecurity Training & Consulting',
    category: 'Cybersecurity',
    turnaround: '1–3 days',
    questions: [
      { id: 'trainees', label: 'How many people need training?', hint: 'Just yourself or a team', type: 'select', options: ['Just me', '2–5 people', '6–20 people', '20+ people'] },
      { id: 'topics', label: 'Which topics interest you?', hint: 'e.g. phishing, password hygiene, safe browsing', type: 'textarea' },
      { id: 'format', label: 'Preferred format?', type: 'select', options: ['Online', 'In-person', 'Not sure yet'] },
    ],
    autoMessage: 'I would like cybersecurity training & consulting. Please share available modules.',
  },
  'Ethical Hacking & Pentesting': {
    name: 'Ethical Hacking & Pentesting',
    category: 'Cybersecurity',
    turnaround: '3–7 days',
    questions: [
      { id: 'scope', label: 'What do you want tested?', type: 'select', options: ['Website', 'Mobile app', 'Office network', 'Not sure'] },
      { id: 'target', label: 'Target URL or IP range', type: 'text' },
      { id: 'auth', label: 'Do you have written authorization to test this target?', hint: 'Proof of ownership or consent', type: 'select', options: ['Yes', 'No', 'Not sure what this means'] },
    ],
    autoMessage: 'I need ethical hacking / pentesting services. I will share the target scope and authorization details.',
  },
  'Network Monitoring & Assessments': {
    name: 'Network Monitoring & Assessments',
    category: 'Cybersecurity',
    turnaround: '2–5 days',
    questions: [
      { id: 'nodes', label: 'How many devices are on the network?', type: 'text' },
      { id: 'nettype', label: 'What type of network?', type: 'select', options: ['Office LAN', 'Wi-Fi only', 'Cloud / remote', 'Mixed'] },
      { id: 'concerns', label: 'Any current concerns?', hint: 'Slow speeds, suspected breach, etc.', type: 'textarea' },
    ],
    autoMessage: 'I need a network monitoring & security assessment. Please advise on next steps.',
  },
  'Data Protection & VPN Setup': {
    name: 'Data Protection & VPN Setup',
    category: 'Cybersecurity',
    turnaround: '1–2 days',
    questions: [
      { id: 'devices', label: 'Which devices need securing?', type: 'select', options: ['Phone', 'Laptop', 'Office network', 'Multiple devices'] },
      { id: 'vpntype', label: 'VPN preference?', type: 'select', options: ['Personal use', 'Business / team', 'Not sure — advise me'] },
    ],
    autoMessage: 'I need data protection & VPN setup. Please guide me on the best option.',
  },
  'Incident Response & Recovery': {
    name: 'Incident Response & Recovery',
    category: 'Cybersecurity',
    turnaround: 'Urgent — same day',
    questions: [
      { id: 'what', label: 'What happened?', type: 'select', options: ['Hacked account', 'Data loss', 'Ransomware', 'Lost access', 'Other'] },
      { id: 'when', label: 'When did it happen?', type: 'text' },
      { id: 'systems', label: 'Which systems are affected?', hint: 'Phone, laptop, email, server', type: 'textarea' },
    ],
    autoMessage: 'URGENT: I need incident response & recovery support. Details to follow on WhatsApp.',
  },

  // ── Web & Digital Presence ──
  'Web Design, Development & Hosting': {
    name: 'Web Design, Development & Hosting',
    category: 'Web & Digital',
    turnaround: '5–14 days',
    questions: [
      { id: 'sitename', label: 'Business or site name', type: 'text', required: true },
      { id: 'sitetype', label: 'What type of website?', type: 'select', options: ['Business site', 'Portfolio', 'Blog', 'Landing page', 'E-commerce', 'Not sure'] },
      { id: 'pages', label: 'Which pages do you need?', hint: 'Home, About, Services, Contact, etc.', type: 'textarea' },
      { id: 'refs', label: 'Any websites you like as reference?', hint: 'Paste URLs if you have any', type: 'textarea' },
    ],
    autoMessage: 'I need a website designed and hosted. I will share details and any reference sites.',
  },
  'Domain Registration & Management': {
    name: 'Domain Registration & Management',
    category: 'Web & Digital',
    turnaround: '1 day',
    questions: [
      { id: 'domain', label: 'Preferred domain name', hint: 'e.g. mybusiness.co.ke', type: 'text', required: true },
      { id: 'regtype', label: 'New registration or renewal?', type: 'select', options: ['New registration', 'Renewal', 'Transfer from another provider'] },
    ],
    autoMessage: 'I need domain registration / management. I will share the preferred domain name.',
  },
  'SEO, Landing Pages & Portfolios': {
    name: 'SEO, Landing Pages & Portfolios',
    category: 'Web & Digital',
    turnaround: '3–7 days',
    questions: [
      { id: 'url', label: 'Website URL (if you already have one)', type: 'text' },
      { id: 'audience', label: 'Who is your target audience?', type: 'textarea' },
      { id: 'goal', label: 'What is your main goal?', type: 'select', options: ['Rank higher on Google', 'Get more leads', 'Showcase my work', 'Build a portfolio', 'Not sure'] },
    ],
    autoMessage: 'I need SEO / landing page / portfolio work. Please share a quote.',
  },
  'E-commerce Setup & Maintenance': {
    name: 'E-commerce Setup & Maintenance',
    category: 'Web & Digital',
    turnaround: '7–14 days',
    questions: [
      { id: 'products', label: 'What products will you sell?', hint: 'Type and approximate number', type: 'textarea', required: true },
      { id: 'payment', label: 'Which payment methods?', type: 'select', options: ['M-Pesa', 'Card', 'PayPal', 'Multiple methods', 'Not sure'] },
      { id: 'platform', label: 'Do you have an existing platform?', type: 'select', options: ['Shopify', 'WooCommerce', 'Starting from scratch', 'Other'] },
    ],
    autoMessage: 'I need an e-commerce store set up. I will share product and payment details.',
  },

  // ── Social Media & Content ──
  'Social Media Account Management': {
    name: 'Social Media Account Management',
    category: 'Social Media',
    turnaround: 'Ongoing',
    questions: [
      { id: 'platforms', label: 'Which platforms?', type: 'select', options: ['Facebook', 'Instagram', 'X (Twitter)', 'TikTok', 'Multiple platforms'] },
      { id: 'handles', label: 'Account handles or links', type: 'textarea' },
      { id: 'frequency', label: 'How often should we post?', type: 'select', options: ['Daily', '3x per week', 'Weekly', 'Not sure — advise me'] },
    ],
    autoMessage: 'I need social media account management & growth. Please share a monthly plan.',
  },
  'Graphics, Copy & Video Scripts': {
    name: 'Graphics, Copy & Video Scripts',
    category: 'Social Media',
    turnaround: '1–3 days',
    questions: [
      { id: 'asset', label: 'What do you need?', type: 'select', options: ['Logo', 'Post designs', 'Ad copy', 'Video script', 'Multiple items'] },
      { id: 'brand', label: 'Do you have brand colors or guidelines?', type: 'select', options: ['Yes', 'No', 'Need help creating them'] },
      { id: 'deadline', label: 'When do you need it?', type: 'text' },
    ],
    autoMessage: 'I need graphics / copy / video script work. I will share the brief.',
  },
  'Brand Strategy & Digital Marketing': {
    name: 'Brand Strategy & Digital Marketing',
    category: 'Social Media',
    turnaround: '5–10 days',
    questions: [
      { id: 'business', label: 'Business name and industry', type: 'text', required: true },
      { id: 'goal', label: 'What is your main goal?', type: 'select', options: ['Get more leads', 'Build brand awareness', 'Increase sales', 'Grow followers', 'Not sure'] },
      { id: 'audience', label: 'Who are your ideal customers?', type: 'textarea' },
    ],
    autoMessage: 'I need brand strategy & digital marketing. Please share a proposal.',
  },
  'LinkedIn Profile Optimization': {
    name: 'LinkedIn Profile Optimization',
    category: 'Social Media',
    turnaround: '1–2 days',
    questions: [
      { id: 'profile', label: 'Your LinkedIn profile URL', type: 'text', required: true },
      { id: 'role', label: 'What profession or role are you targeting?', type: 'text' },
    ],
    autoMessage: 'I need LinkedIn profile optimization. I will share my profile link.',
  },

  // ── Admin & E-Correspondence ──
  'Professional Document Formatting': {
    name: 'Professional Document Formatting',
    category: 'Admin & E-Correspondence',
    turnaround: '1–2 days',
    questions: [
      { id: 'doctype', label: 'What type of document?', type: 'select', options: ['Report', 'Proposal', 'Manual', 'Letter', 'Other'] },
      { id: 'pages', label: 'Approximate page count', type: 'text' },
      { id: 'format', label: 'What format do you need?', type: 'select', options: ['Word', 'PDF', 'Specific template', 'Not sure'] },
    ],
    autoMessage: 'I need professional document formatting. I will share the document.',
  },
  'Email Management & Drafting': {
    name: 'Email Management & Drafting',
    category: 'Admin & E-Correspondence',
    turnaround: '1–2 days',
    questions: [
      { id: 'emailtype', label: 'What email provider?', type: 'select', options: ['Gmail', 'Outlook', 'Yahoo', 'Custom domain', 'Not sure'] },
      { id: 'need', label: 'What do you need help with?', type: 'select', options: ['Inbox cleanup', 'Drafting emails', 'Auto-replies', 'Full management', 'Other'] },
    ],
    autoMessage: 'I need email management & drafting help. Please advise.',
  },
  'Online Research & Data Compilation': {
    name: 'Online Research & Data Compilation',
    category: 'Admin & E-Correspondence',
    turnaround: '2–4 days',
    questions: [
      { id: 'topic', label: 'What is the research topic?', type: 'textarea', required: true },
      { id: 'output', label: 'How should the results be presented?', type: 'select', options: ['Report', 'Spreadsheet', 'Summary document', 'Not sure'] },
    ],
    autoMessage: 'I need online research & data compilation. I will share the topic.',
  },
  'Virtual Assistant & Secretarial': {
    name: 'Virtual Assistant & Secretarial',
    category: 'Admin & E-Correspondence',
    turnaround: 'Ongoing',
    questions: [
      { id: 'tasks', label: 'What tasks do you need help with?', hint: 'Scheduling, data entry, calls, etc.', type: 'textarea', required: true },
      { id: 'hours', label: 'How many hours per week?', type: 'select', options: ['1–5 hours', '5–10 hours', '10–20 hours', 'Full-time'] },
    ],
    autoMessage: 'I need a virtual assistant / secretarial support. Please share a plan.',
  },
  'CV / Resume & Cover Letter Writing': {
    name: 'CV / Resume & Cover Letter Writing',
    category: 'Admin & E-Correspondence',
    turnaround: '1–3 days',
    questions: [
      { id: 'currentcv', label: 'Do you have a current CV?', type: 'select', options: ['Yes — I will share it', 'No — start from scratch', 'Just need updates'] },
      { id: 'targetrole', label: 'What job or industry are you targeting?', type: 'text', required: true },
      { id: 'coverletter', label: 'Do you also need a cover letter?', type: 'select', options: ['Yes', 'No', 'Maybe'] },
    ],
    autoMessage: 'I need a CV / resume & cover letter. I will share my current CV and target role.',
  },

  // ── Data & Cloud ──
  'Cloud Setup (Drive, OneDrive, Dropbox)': {
    name: 'Cloud Setup (Drive, OneDrive, Dropbox)',
    category: 'Data & Cloud',
    turnaround: '1–2 days',
    questions: [
      { id: 'platform', label: 'Which platform?', type: 'select', options: ['Google Drive', 'OneDrive', 'Dropbox', 'Not sure — advise me'] },
      { id: 'users', label: 'How many people will use it?', type: 'select', options: ['Just me', '2–5 people', '6+ people'] },
      { id: 'storage', label: 'How much storage do you need?', type: 'select', options: ['Under 15 GB', '15–100 GB', '100 GB – 1 TB', 'Over 1 TB', 'Not sure'] },
    ],
    autoMessage: 'I need cloud storage setup. Please guide me on the best option.',
  },
  'Data Backup & Recovery': {
    name: 'Data Backup & Recovery',
    category: 'Data & Cloud',
    turnaround: '1–3 days',
    questions: [
      { id: 'device', label: 'What needs backing up or recovering?', type: 'select', options: ['Phone', 'Laptop', 'External drive', 'Server', 'Other'] },
      { id: 'datasize', label: 'Approximate data size', type: 'select', options: ['Under 10 GB', '10–100 GB', '100 GB – 1 TB', 'Over 1 TB', 'Not sure'] },
      { id: 'situation', label: 'Is this a new backup or recovering lost data?', type: 'select', options: ['New backup setup', 'Recovering lost data', 'Both'] },
    ],
    autoMessage: 'I need data backup / recovery. I will share details on WhatsApp.',
  },
  'Database Creation & File Archiving': {
    name: 'Database Creation & File Archiving',
    category: 'Data & Cloud',
    turnaround: '3–7 days',
    questions: [
      { id: 'purpose', label: 'What is the database for?', type: 'textarea', required: true },
      { id: 'datatype', label: 'What kind of data will you store?', hint: 'Customers, inventory, records, etc.', type: 'text' },
      { id: 'tool', label: 'Preferred tool?', type: 'select', options: ['Excel', 'Google Sheets', 'Access', 'SQL database', 'Not sure — advise me'] },
    ],
    autoMessage: 'I need a database created / files archived. I will share the requirements.',
  },

  // ── Digital Skills Training ──
  'Computer Literacy & MS Office': {
    name: 'Computer Literacy & MS Office',
    category: 'Digital Skills',
    turnaround: '1–2 weeks',
    questions: [
      { id: 'level', label: 'Current skill level?', type: 'select', options: ['Complete beginner', 'Basic', 'Intermediate', 'Advanced'] },
      { id: 'topics', label: 'Which topics?', type: 'select', options: ['Word', 'Excel', 'PowerPoint', 'Email', 'All of them'] },
      { id: 'format', label: 'Preferred format?', type: 'select', options: ['Online', 'In-person', 'Not sure'] },
    ],
    autoMessage: 'I need computer literacy & MS Office training. Please share a schedule.',
  },
  'Cyber Hygiene & Internet Safety': {
    name: 'Cyber Hygiene & Internet Safety',
    category: 'Digital Skills',
    turnaround: '1–2 sessions',
    questions: [
      { id: 'who', label: 'Who is the training for?', type: 'select', options: ['Myself', 'My staff', 'My family', 'A group'] },
      { id: 'count', label: 'How many people?', type: 'text' },
    ],
    autoMessage: 'I need cyber hygiene & internet safety training. Please share details.',
  },
  'Professional Social Media Skills': {
    name: 'Professional Social Media Skills',
    category: 'Digital Skills',
    turnaround: '1–3 sessions',
    questions: [
      { id: 'goal', label: 'What is your goal?', type: 'select', options: ['Personal branding', 'Business growth', 'Content creation', 'Not sure'] },
      { id: 'platforms', label: 'Which platforms interest you?', type: 'select', options: ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Multiple'] },
    ],
    autoMessage: 'I need professional social media skills training. Please share a plan.',
  },
  'Digital Entrepreneurship Coaching': {
    name: 'Digital Entrepreneurship Coaching',
    category: 'Digital Skills',
    turnaround: '2–4 weeks',
    questions: [
      { id: 'idea', label: 'What is your business idea or current business?', type: 'textarea', required: true },
      { id: 'stage', label: 'Where are you now?', type: 'select', options: ['Just an idea', 'Starting out', 'Already running', 'Looking to grow'] },
    ],
    autoMessage: 'I need digital entrepreneurship coaching. I will share my business idea.',
  },

  // ── Government Compliance ──
  'Business & Company Registration': {
    name: 'Business & Company Registration',
    category: 'Government',
    turnaround: '7–14 days',
    questions: [
      { id: 'bizname', label: 'Proposed business name(s)', type: 'text', required: true },
      { id: 'biztype', label: 'What type of business?', type: 'select', options: ['Sole proprietor', 'Partnership', 'Limited company', 'Not sure'] },
      { id: 'idready', label: 'Do you have the owner(s) ID copy?', type: 'select', options: ['Yes', 'No', 'Need guidance'] },
      { id: 'krapin', label: 'Does the owner have a KRA PIN?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
      { id: 'location', label: 'Business location or address', type: 'text' },
    ],
    autoMessage: 'I need business / company registration. I will share the proposed name(s) and owner details.',
  },
  'KRA PIN, iTax Setup & Returns': {
    name: 'KRA PIN, iTax Setup & Returns',
    category: 'Government',
    turnaround: '1–3 days',
    questions: [
      { id: 'idready', label: 'Do you have your National ID (both sides)?', type: 'select', options: ['Yes', 'No'] },
      { id: 'haspin', label: 'Do you already have a KRA PIN?', type: 'select', options: ['Yes — need help with returns', 'No — need new PIN', 'Not sure'] },
      { id: 'photo', label: 'Do you have a passport-size photo?', type: 'select', options: ['Yes', 'No'] },
      { id: 'email', label: 'Email address for the KRA portal', type: 'text' },
      { id: 'returntype', label: 'What type of returns?', type: 'select', options: ['PIN registration', 'VAT returns', 'PAYE', 'Annual returns', 'Not sure'] },
    ],
    autoMessage: 'I need KRA PIN / iTax setup & returns filing. I will share my ID copy and details on WhatsApp.',
  },
  'VAT & County Business Permits': {
    name: 'VAT & County Business Permits',
    category: 'Government',
    turnaround: '3–7 days',
    questions: [
      { id: 'krapin', label: 'Do you have your KRA PIN and certificate?', type: 'select', options: ['Yes', 'No'] },
      { id: 'bizcert', label: 'Do you have the business registration certificate?', type: 'select', options: ['Yes', 'No'] },
      { id: 'county', label: 'Which county and town is the business in?', type: 'text', required: true },
    ],
    autoMessage: 'I need VAT registration & county business permits. I will share my KRA and business details.',
  },
  'NGO / CBO & ODPC Registration': {
    name: 'NGO / CBO & ODPC Registration',
    category: 'Government',
    turnaround: '2–6 weeks',
    questions: [
      { id: 'orgtype', label: 'What are you registering?', type: 'select', options: ['NGO', 'CBO', 'ODPC (data protection)', 'Not sure'] },
      { id: 'orgname', label: 'Organization name', type: 'text', required: true },
      { id: 'officials', label: 'How many founders or officials?', type: 'text' },
      { id: 'constitution', label: 'Do you have a constitution or objectives document?', type: 'select', options: ['Yes', 'No', 'Need help drafting one'] },
    ],
    autoMessage: 'I need NGO / CBO / ODPC registration. I will share the organization details.',
  },
  'SHA, NSSF & Annual Returns': {
    name: 'SHA, NSSF & Annual Returns',
    category: 'Government',
    turnaround: '1–5 days',
    questions: [
      { id: 'idready', label: 'Do you have your National ID?', type: 'select', options: ['Yes', 'No'] },
      { id: 'krapin', label: 'Do you have your KRA PIN?', type: 'select', options: ['Yes', 'No'] },
      { id: 'service', label: 'Which service do you need?', type: 'select', options: ['SHA registration', 'NSSF registration', 'Annual returns', 'All of them', 'Not sure'] },
      { id: 'employed', label: 'Are you employed or self-employed?', type: 'select', options: ['Employed', 'Self-employed', 'Unemployed'] },
    ],
    autoMessage: 'I need SHA / NSSF / annual returns filing. I will share my ID and KRA PIN.',
  },
  'e-Citizen Navigation & Tenders': {
    name: 'e-Citizen Navigation & Tenders',
    category: 'Government',
    turnaround: '1–3 days',
    questions: [
      { id: 'need', label: 'What do you need to do on e-Citizen?', type: 'select', options: ['Apply for a service', 'Check application status', 'Apply for a tender', 'Account setup help', 'Other'] },
      { id: 'account', label: 'Do you have an e-Citizen account?', type: 'select', options: ['Yes', 'No', 'Having trouble logging in'] },
    ],
    autoMessage: 'I need help navigating e-Citizen / tenders. Please guide me.',
  },

  // ── Student Support ──
  'Academic Research, Reports & Essays': {
    name: 'Academic Research, Reports & Essays',
    category: 'Student Support',
    turnaround: '2–5 days',
    questions: [
      { id: 'topic', label: 'What is the topic or research question?', type: 'textarea', required: true },
      { id: 'length', label: 'How many words or pages?', type: 'text' },
      { id: 'citation', label: 'Which citation style?', type: 'select', options: ['APA', 'MLA', 'Harvard', 'Chicago', 'Not sure'] },
      { id: 'deadline', label: 'When is the deadline?', type: 'text', required: true },
    ],
    autoMessage: 'I need academic research / report / essay help. I will share the topic and requirements.',
  },
  'Thesis / Dissertation Formatting': {
    name: 'Thesis / Dissertation Formatting',
    category: 'Student Support',
    turnaround: '2–4 days',
    questions: [
      { id: 'docready', label: 'Do you have the document ready?', type: 'select', options: ['Yes — soft copy ready', 'Partially done', 'No'] },
      { id: 'guidelines', label: 'Do you have the university formatting guidelines?', type: 'select', options: ['Yes', 'No', 'Need help finding them'] },
      { id: 'citation', label: 'Which citation style?', type: 'select', options: ['APA', 'MLA', 'Harvard', 'Not sure'] },
    ],
    autoMessage: 'I need thesis / dissertation formatting. I will share the document and guidelines.',
  },
  'Typing, Editing & PPT Presentations': {
    name: 'Typing, Editing & PPT Presentations',
    category: 'Student Support',
    turnaround: '1–3 days',
    questions: [
      { id: 'servicetype', label: 'What do you need?', type: 'select', options: ['Typing', 'Editing', 'PowerPoint presentation', 'Multiple'] },
      { id: 'count', label: 'How many pages or slides?', type: 'text' },
      { id: 'deadline', label: 'When do you need it?', type: 'text', required: true },
    ],
    autoMessage: 'I need typing / editing / PPT presentation work. I will share the details.',
  },
  'University, Scholarship & HELB Apps': {
    name: 'University, Scholarship & HELB Apps',
    category: 'Student Support',
    turnaround: '1–3 days',
    questions: [
      { id: 'apptype', label: 'What are you applying for?', type: 'select', options: ['University admission', 'Scholarship', 'HELB loan', 'Transfer', 'Other'] },
      { id: 'index', label: 'KCSE index number (if applicable)', type: 'text' },
      { id: 'idready', label: 'Do you have your ID or birth certificate?', type: 'select', options: ['Yes', 'No'] },
    ],
    autoMessage: 'I need help with a university / scholarship / HELB application. I will share my details.',
  },
  'Student Portals & LMS Navigation': {
    name: 'Student Portals & LMS Navigation',
    category: 'Student Support',
    turnaround: 'Same day',
    questions: [
      { id: 'institution', label: 'Which university or institution?', type: 'text', required: true },
      { id: 'portal', label: 'Which portal or LMS?', hint: 'e.g. Moodle, Canvas, student portal', type: 'text' },
      { id: 'issue', label: 'What do you need help with?', type: 'textarea' },
    ],
    autoMessage: 'I need help navigating my student portal / LMS. I will share the details.',
  },
  'Internship Letters & Career Guidance': {
    name: 'Internship Letters & Career Guidance',
    category: 'Student Support',
    turnaround: '1–2 days',
    questions: [
      { id: 'field', label: 'What is your field of study or career interest?', type: 'text', required: true },
      { id: 'need', label: 'What do you need?', type: 'select', options: ['Internship letter', 'CV help', 'Career advice', 'All of the above'] },
    ],
    autoMessage: 'I need an internship letter / career guidance. I will share my field of study.',
  },

  // ── Creative & Design ──
  'Logo & Brand Identity Design': {
    name: 'Logo & Brand Identity Design',
    category: 'Creative & Design',
    turnaround: '3–7 days',
    questions: [
      { id: 'bizname', label: 'Business or brand name', type: 'text', required: true },
      { id: 'style', label: 'Preferred style?', type: 'select', options: ['Minimalist', 'Modern', 'Classic', 'Playful', 'Not sure — advise me'] },
      { id: 'colors', label: 'Any preferred colors?', type: 'text' },
      { id: 'usage', label: 'Where will the logo be used?', type: 'select', options: ['Website', 'Social media', 'Print', 'Merchandise', 'Everywhere'] },
    ],
    autoMessage: 'I need a logo & brand identity design. I will share my brand name and preferences.',
  },
  'Flyer, Poster & Banner Design': {
    name: 'Flyer, Poster & Banner Design',
    category: 'Creative & Design',
    turnaround: '1–3 days',
    questions: [
      { id: 'assettype', label: 'What do you need?', type: 'select', options: ['Flyer', 'Poster', 'Banner', 'Multiple items'] },
      { id: 'purpose', label: 'What is it for?', hint: 'Event, promotion, announcement', type: 'text', required: true },
      { id: 'size', label: 'What size?', type: 'select', options: ['A4', 'A3', 'Social media size', 'Custom', 'Not sure'] },
      { id: 'deadline', label: 'When do you need it?', type: 'text' },
    ],
    autoMessage: 'I need a flyer / poster / banner design. I will share the details and deadline.',
  },
  'Business Card & Letterhead Design': {
    name: 'Business Card & Letterhead Design',
    category: 'Creative & Design',
    turnaround: '1–2 days',
    questions: [
      { id: 'items', label: 'What do you need?', type: 'select', options: ['Business cards', 'Letterhead', 'Both', 'Full stationery set'] },
      { id: 'qty', label: 'How many cards?', type: 'text' },
      { id: 'logo', label: 'Do you have a logo?', type: 'select', options: ['Yes', 'No — need one designed', 'Not sure'] },
    ],
    autoMessage: 'I need business card / letterhead design. I will share my details.',
  },
  'Photo Editing & Retouching': {
    name: 'Photo Editing & Retouching',
    category: 'Creative & Design',
    turnaround: '1–2 days',
    questions: [
      { id: 'phototype', label: 'What type of photos?', type: 'select', options: ['Product photos', 'Portrait', 'Event photos', 'Real estate', 'Other'] },
      { id: 'count', label: 'How many photos?', type: 'text' },
      { id: 'edits', label: 'What edits do you need?', type: 'select', options: ['Color correction', 'Background removal', 'Retouching', 'All of the above', 'Not sure'] },
    ],
    autoMessage: 'I need photo editing / retouching. I will share the photos and requirements.',
  },

  // ── Mobile & App Services ──
  'Mobile App Development': {
    name: 'Mobile App Development',
    category: 'Mobile & App',
    turnaround: '2–8 weeks',
    questions: [
      { id: 'platform', label: 'Which platform?', type: 'select', options: ['Android', 'iOS', 'Both', 'Not sure'] },
      { id: 'apptype', label: 'What type of app?', type: 'select', options: ['Business app', 'E-commerce', 'Educational', 'Social', 'Utility', 'Not sure'] },
      { id: 'features', label: 'Key features you need?', hint: 'Login, payments, maps, etc.', type: 'textarea' },
      { id: 'budget', label: 'Do you have a design/mockup?', type: 'select', options: ['Yes', 'No — need design too', 'Not sure'] },
    ],
    autoMessage: 'I need a mobile app developed. I will share the platform and feature requirements.',
  },
  'App Bug Fixing & Maintenance': {
    name: 'App Bug Fixing & Maintenance',
    category: 'Mobile & App',
    turnaround: '1–5 days',
    questions: [
      { id: 'platform', label: 'Which platform?', type: 'select', options: ['Android', 'iOS', 'Web app', 'Multiple'] },
      { id: 'issue', label: 'What is the issue?', type: 'textarea', required: true },
      { id: 'access', label: 'Do you have the source code?', type: 'select', options: ['Yes', 'No', 'Partial'] },
    ],
    autoMessage: 'I need app bug fixing / maintenance. I will share the issue details.',
  },
};

export const fallbackService: ServiceInfo = {
  name: 'General Enquiry',
  category: 'Other',
  questions: [],
  autoMessage: 'I would like to inquire about your services. Please share more details.',
};

export function getServiceInfo(serviceName: string): ServiceInfo {
  return serviceCatalog[serviceName] || { ...fallbackService, name: serviceName };
}

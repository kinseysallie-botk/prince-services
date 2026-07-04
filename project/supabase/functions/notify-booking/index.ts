import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { booking_id, name, phone, email, service, message } = await req.json();

    if (!name || !phone || !service) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, phone, service" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    const recipientEmail = Deno.env.get("NOTIFICATION_EMAIL") || gmailUser;

    if (!gmailUser || !gmailAppPassword) {
      console.error("Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD secrets.");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subject = `New Booking: ${service} — ${name}`;
    const textBody = `
New booking received on Prince Services website!

Booking Reference: PS-${booking_id ? booking_id.slice(0, 8).toUpperCase() : "N/A"}

Customer Details:
  Name: ${name}
  Phone: ${phone}
  Email: ${email || "Not provided"}
  Service: ${service}
  Message: ${message || "None"}

Timestamp: ${new Date().toISOString()}

Please contact the customer on WhatsApp within 30 minutes.
    `.trim();

    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #071524, #0d2137); padding: 24px; border-radius: 16px 16px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">New Booking Received</h1>
    <p style="color: #94a3b8; margin: 4px 0 0;">Prince Services — Booking Notification</p>
  </div>
  <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 120px;">Reference</td><td style="padding: 8px 0; color: #0f172a;">PS-${booking_id ? booking_id.slice(0, 8).toUpperCase() : "N/A"}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Name</td><td style="padding: 8px 0; color: #0f172a;">${name}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Phone</td><td style="padding: 8px 0; color: #0f172a;">${phone}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Email</td><td style="padding: 8px 0; color: #0f172a;">${email || "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Service</td><td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${service}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Message</td><td style="padding: 8px 0; color: #0f172a;">${message || "None"}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; font-weight: bold;">Time</td><td style="padding: 8px 0; color: #0f172a;">${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</td></tr>
    </table>
    <div style="margin-top: 20px; padding: 16px; background: #ecfeff; border-radius: 12px; border: 1px solid #a5f3fc;">
      <p style="margin: 0; color: #0e7490; font-size: 14px; font-weight: bold;">Please contact the customer on WhatsApp within 30 minutes.</p>
    </div>
  </div>
</div>
    `.trim();

    // Send email via Gmail SMTP using a simple SMTP client
    const emailSent = await sendGmail({
      to: recipientEmail,
      subject,
      text: textBody,
      html: htmlBody,
      gmailUser,
      gmailAppPassword,
    });

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in notify-booking:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendGmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  gmailUser: string;
  gmailAppPassword: string;
}): Promise<boolean> {
  // Gmail SMTP requires TLS. We use a raw TCP socket via Deno.connect to
  // talk SMTP to smtp.gmail.com:465 (implicit TLS).
  // Deno doesn't have a built-in SMTP client, so we implement a minimal one.

  const { to, subject, text, html, gmailUser, gmailAppPassword } = opts;

  const rawEmail = [
    `From: Prince Services <${gmailUser}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset=UTF-8',
    "",
    html,
  ].join("\r\n");

  try {
    const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });

    const readLine = async (): Promise<string> => {
      const buf = new Uint8Array(1024);
      let line = "";
      while (true) {
        const n = await conn.read(buf);
        if (n === null) break;
        line += new TextDecoder().decode(buf.subarray(0, n));
        if (line.includes("\r\n")) break;
      }
      return line.trim();
    };

    const send = (data: string) => {
      conn.write(new TextEncoder().encode(data + "\r\n"));
    };

    await readLine(); // 220 greeting
    send("EHLO localhost");
    await readLine(); // response

    send("AUTH LOGIN");
    await readLine(); // 334
    send(btoa(gmailUser));
    await readLine(); // 334
    send(btoa(gmailAppPassword));
    const authResp = await readLine();
    if (!authResp.startsWith("235")) {
      conn.close();
      console.error("Gmail auth failed:", authResp);
      return false;
    }

    send(`MAIL FROM:<${gmailUser}>`);
    await readLine();
    send(`RCPT TO:<${to}>`);
    await readLine();
    send("DATA");
    await readLine();
    send(rawEmail);
    send(".");
    const dataResp = await readLine();
    send("QUIT");
    conn.close();

    return dataResp.startsWith("250");
  } catch (err) {
    console.error("SMTP error:", err.message);
    return false;
  }
}

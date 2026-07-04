import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminRequest {
  action: "login" | "verify" | "logout" | "get_bookings" | "update_booking" | "delete_booking" | "change_password";
  password?: string;
  token?: string;
  bookingId?: string;
  status?: string;
  notes?: string;
  newPassword?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: AdminRequest = await req.json();
    const { action, password, token, bookingId, status, notes, newPassword } = body;

    // Helper to call Supabase RPC with service role key
    const rpc = async (fn: string, params: Record<string, unknown>) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return { data, error: !response.ok ? data : null };
    };

    switch (action) {
      case "login": {
        if (!password) {
          return new Response(JSON.stringify({ error: "Password required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await rpc("admin_login", { plain_password: password });
        if (result.error || !result.data) {
          return new Response(JSON.stringify({ error: "Invalid password" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ token: result.data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "verify": {
        if (!token) {
          return new Response(JSON.stringify({ error: "Token required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await rpc("admin_verify_session", { token });
        return new Response(JSON.stringify({ valid: !!result.data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "logout": {
        if (!token) {
          return new Response(JSON.stringify({ error: "Token required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await rpc("admin_logout", { token });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_bookings": {
        if (!token) {
          return new Response(JSON.stringify({ error: "Token required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await rpc("admin_get_bookings", { token });
        if (result.error) {
          return new Response(JSON.stringify({ error: "Unauthorized or invalid session" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ bookings: result.data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_booking": {
        if (!token || !bookingId || !status) {
          return new Response(JSON.stringify({ error: "Token, bookingId, and status required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await rpc("admin_update_booking", {
          token,
          booking_id: bookingId,
          new_status: status,
          new_notes: notes || null,
        });
        if (result.error) {
          return new Response(JSON.stringify({ error: "Failed to update booking" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: result.data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_booking": {
        if (!token || !bookingId) {
          return new Response(JSON.stringify({ error: "Token and bookingId required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await rpc("admin_delete_booking", { token, booking_id: bookingId });
        if (result.error) {
          return new Response(JSON.stringify({ error: "Failed to delete booking" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: result.data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change_password": {
        if (!token || !newPassword) {
          return new Response(JSON.stringify({ error: "Token and newPassword required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const result = await rpc("admin_change_password", { token, new_password: newPassword });
        if (result.error) {
          return new Response(JSON.stringify({ error: "Failed to change password" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: result.data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

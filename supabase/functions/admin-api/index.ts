import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  balance: number;
  status: string;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Verify the caller is authenticated
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.status === "suspended") {
      return new Response(JSON.stringify({ error: "Account suspended" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/admin-api", "").replace("/admin-api", "");
    const method = req.method;

    // GET /users — list all users with stats
    if (path === "/users" && method === "GET") {
      const { data: users, error: usersError } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) {
        return new Response(JSON.stringify({ error: usersError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get aggregate stats
      const { data: investments } = await adminClient
        .from("investments")
        .select("amount, total_earned, status");
      const { data: transactions } = await adminClient
        .from("transactions")
        .select("amount, type, status");

      const totalBalance = (users as AdminUser[]).reduce((s, u) => s + Number(u.balance), 0);
      const totalDeposits = (transactions || [])
        .filter((t: any) => t.type === "deposit" && t.status === "completed")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const totalWithdrawals = (transactions || [])
        .filter((t: any) => t.type === "withdrawal" && t.status === "completed")
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      const activeInvestments = (investments || []).filter((i: any) => i.status === "active");
      const totalInvested = activeInvestments.reduce((s: number, i: any) => s + Number(i.amount), 0);

      return new Response(JSON.stringify({
        users,
        stats: {
          totalUsers: (users as AdminUser[]).length,
          totalBalance,
          totalDeposits,
          totalWithdrawals,
          totalInvested,
          activeInvestments: activeInvestments.length,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /users/:id/update — update user balance/status
    const updateUserMatch = path.match(/^\/users\/([^/]+)\/update$/);
    if (updateUserMatch && method === "POST") {
      const userId = updateUserMatch[1];
      const body = await req.json();
      const updates: Record<string, any> = {};

      if (typeof body.balance === "number") {
        updates.balance = body.balance;
      }
      if (body.status === "active" || body.status === "suspended") {
        updates.status = body.status;
      }
      if (body.role === "user" || body.role === "admin") {
        updates.role = body.role;
      }

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ error: "No valid fields to update" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error: updateError } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .maybeSingle();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ user: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /transactions — list all transactions
    if (path === "/transactions" && method === "GET") {
      const { data, error: txError } = await adminClient
        .from("transactions")
        .select("*, profile:profiles(email, full_name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (txError) {
        return new Response(JSON.stringify({ error: txError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ transactions: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /transactions/:id/status — approve/reject transaction
    const txStatusMatch = path.match(/^\/transactions\/([^/]+)\/status$/);
    if (txStatusMatch && method === "POST") {
      const txId = txStatusMatch[1];
      const body = await req.json();

      if (!["completed", "rejected", "failed"].includes(body.status)) {
        return new Response(JSON.stringify({ error: "Invalid status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tx } = await adminClient
        .from("transactions")
        .select("*")
        .eq("id", txId)
        .maybeSingle();

      if (!tx) {
        return new Response(JSON.stringify({ error: "Transaction not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient
        .from("transactions")
        .update({ status: body.status })
        .eq("id", txId);

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If approving a deposit, credit the user's balance
      if (body.status === "completed" && tx.type === "deposit" && tx.status === "pending") {
        const { data: userProfile } = await adminClient
          .from("profiles")
          .select("balance")
          .eq("id", tx.user_id)
          .maybeSingle();

        if (userProfile) {
          await adminClient
            .from("profiles")
            .update({ balance: Number(userProfile.balance) + Number(tx.amount) })
            .eq("id", tx.user_id);
        }
      }

      // If approving a withdrawal, deduct from balance
      if (body.status === "completed" && tx.type === "withdrawal" && tx.status === "pending") {
        const { data: userProfile } = await adminClient
          .from("profiles")
          .select("balance")
          .eq("id", tx.user_id)
          .maybeSingle();

        if (userProfile) {
          await adminClient
            .from("profiles")
            .update({ balance: Number(userProfile.balance) - Number(tx.amount) })
            .eq("id", tx.user_id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /investments — list all investments
    if (path === "/investments" && method === "GET") {
      const { data, error: invError } = await adminClient
        .from("investments")
        .select("*, profile:profiles(email, full_name), plan:investment_plans(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (invError) {
        return new Response(JSON.stringify({ error: invError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ investments: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /plans — list all plans
    if (path === "/plans" && method === "GET") {
      const { data, error: plansError } = await adminClient
        .from("investment_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (plansError) {
        return new Response(JSON.stringify({ error: plansError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ plans: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /plans/:id — update plan
    const planMatch = path.match(/^\/plans\/([^/]+)$/);
    if (planMatch && method === "PUT") {
      const planId = planMatch[1];
      const body = await req.json();
      const allowedFields = [
        "name", "description", "min_amount", "max_amount",
        "roi_percentage", "duration_days", "features", "is_active", "sort_order",
      ];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in body) updates[key] = body[key];
      }

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ error: "No valid fields to update" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error: updateError } = await adminClient
        .from("investment_plans")
        .update(updates)
        .eq("id", planId)
        .select()
        .maybeSingle();

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ plan: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

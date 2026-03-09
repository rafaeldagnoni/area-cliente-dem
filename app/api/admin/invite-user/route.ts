import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function validateAdmin(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return { ok: false, error: "Não autenticado." };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    return { ok: false, error: "Sessão inválida." };
  }

  const allowedEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAllowed = allowedEmails.includes(data.user.email.toLowerCase());

  if (!isAllowed) {
    return { ok: false, error: "Acesso negado." };
  }

  return { ok: true };
}

type AdminUser = {
  id: string;
  email?: string | null;
};

export async function POST(req: Request) {
  const auth = await validateAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const companyId = String(body.companyId || "").trim();

    if (!email || !companyId) {
      return NextResponse.json(
        { error: "Email e companyId são obrigatórios." },
        { status: 400 }
      );
    }

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    const users = (usersData?.users || []) as AdminUser[];

    let user = users.find(
      (u) => (u.email || "").toLowerCase() === email
    );

    if (!user) {
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        });

      if (inviteError) {
        return NextResponse.json(
          { error: inviteError.message },
          { status: 400 }
        );
      }

      user = inviteData.user
        ? {
            id: inviteData.user.id,
            email: inviteData.user.email,
          }
        : undefined;
    }

    if (!user?.id) {
      return NextResponse.json(
        { error: "Não foi possível obter o usuário." },
        { status: 400 }
      );
    }

    const { data: existingLink } = await supabaseAdmin
      .from("user_companies")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (!existingLink) {
      const { error: linkError } = await supabaseAdmin
        .from("user_companies")
        .insert([
          {
            user_id: user.id,
            company_id: companyId,
          },
        ]);

      if (linkError) {
        return NextResponse.json(
          { error: linkError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email,
      companyId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

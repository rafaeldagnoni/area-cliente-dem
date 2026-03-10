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

export async function GET(req: Request) {
  const auth = await validateAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, slug, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ companies: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await validateAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const slug = String(body?.slug || "").trim().toLowerCase();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nome e slug são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("companies")
      .insert([
        {
          name,
          slug,
          status: "active",
        },
      ])
      .select("id, name, slug, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ company: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

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

export async function DELETE(req: Request) {
  const auth = await validateAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const companyId = String(body?.companyId || "").trim();

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: "userId e companyId são obrigatórios." },
        { status: 400 }
      );
    }

    const { data: existingLink, error: existingError } = await supabaseAdmin
      .from("user_companies")
      .select("id")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 400 }
      );
    }

    if (!existingLink) {
      return NextResponse.json(
        { error: "Vínculo não encontrado." },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_companies")
      .delete()
      .eq("user_id", userId)
      .eq("company_id", companyId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

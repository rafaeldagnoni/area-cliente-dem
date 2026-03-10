import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type AuthUserLite = {
  id: string;
  email?: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

type UserCompanyRow = {
  user_id: string;
  company_id: string;
};

export async function GET(req: Request) {
  const auth = await validateAdmin(req);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  try {
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from("companies")
      .select("id, name, slug, status")
      .order("created_at", { ascending: false });

    if (companiesError) {
      return NextResponse.json(
        { error: companiesError.message },
        { status: 400 }
      );
    }

    const { data: links, error: linksError } = await supabaseAdmin
      .from("user_companies")
      .select("user_id, company_id");

    if (linksError) {
      return NextResponse.json(
        { error: linksError.message },
        { status: 400 }
      );
    }

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 400 }
      );
    }

    const authUsers = (usersData?.users || []) as AuthUserLite[];
    const companiesList = (companies || []) as CompanyRow[];
    const linksList = (links || []) as UserCompanyRow[];

    const usersById = new Map<string, AuthUserLite>();
    for (const user of authUsers) {
      usersById.set(user.id, user);
    }

    const result = companiesList.map((company) => {
      const companyLinks = linksList.filter(
        (link) => link.company_id === company.id
      );

      const users = companyLinks.map((link) => {
        const user = usersById.get(link.user_id);

        return {
          id: link.user_id,
          email: user?.email || "Usuário sem email",
        };
      });

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: company.status || "active",
        users,
      };
    });

    return NextResponse.json(
      { companies: result },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

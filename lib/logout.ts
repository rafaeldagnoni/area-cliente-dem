import { supabase } from "@/lib/supabaseClient";

export async function logoutUser() {
  localStorage.removeItem("active_company_slug");
  localStorage.removeItem("active_company_id");
  localStorage.removeItem("active_company_name");

  await supabase.auth.signOut();

  window.location.href = "/";
}

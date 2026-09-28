import { NextResponse } from "next/server";
import { ErrorApi, getDashboard } from "@/lib/matching/api";
import { ensureRegionFresh } from "@/lib/matching/recalc";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureRegionFresh();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const dashboard = await getDashboard(supabase, user.id);
    return NextResponse.json(dashboard);
  } catch (e) {
    if (e instanceof ErrorApi) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[matches/dashboard]", e);
    return NextResponse.json(
      { error: "No se pudo cargar el dashboard de matches" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { ErrorApi, postDescartar } from "@/lib/matching/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ clave: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { clave: raw } = await params;
    const clave = decodeURIComponent(raw);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await postDescartar(supabase, user.id, clave);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErrorApi) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[matches/descartar]", e);
    return NextResponse.json(
      { error: "No se pudo descartar la sugerencia" },
      { status: 500 },
    );
  }
}

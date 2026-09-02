import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Query 1 row from inventory table (or catalog_items)
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          error: error.message,
          details: error.details || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        connected: true,
        message: "Database connection successful",
        count: data ? data.length : 0,
        sample: data ? data[0] : null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        error: err?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

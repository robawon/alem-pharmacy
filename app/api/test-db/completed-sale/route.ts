import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  console.log("TEST SUPABASE AUTH USER:", user);
  console.log("TEST SUPABASE AUTH ERROR:", authError);
  console.log("TEST SUPABASE SESSION:", sessionData.session);
  console.log("TEST SUPABASE SESSION ERROR:", sessionError);

  if (!user) {
    return NextResponse.json(
      { data: null, error: authError?.message ?? "No authenticated Supabase user" },
      { status: 401 },
    );
  }

  const testPayload = {
    id: `diagnostic-${crypto.randomUUID()}`,
    items: [],
    subtotal: 0,
    discount: null,
    discount_amount: 0,
    tax: 0,
    total: 0,
    payment_method: "cash",
    amount_tendered: 0,
    change_due: 0,
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("completed_sales")
    .insert(testPayload)
    .select();

  console.log("TEST INSERT DATA:", data);
  console.log("TEST INSERT ERROR:", error);

  return NextResponse.json(
    { data, error, authUser: user, session: sessionData.session },
    { status: error ? 500 : 200 },
  );
}
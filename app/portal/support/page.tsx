"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Phone, Mail, MessageCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";

const FAQS = [
  {
    q: "How long does prescription approval take?",
    a: "Our pharmacists typically review and approve prescriptions within 1–2 hours during business hours (8AM–9PM).",
  },
  {
    q: "Can I order Rx medications without a prescription?",
    a: "No. Prescription-only (Rx) medications require a valid doctor's prescription that must be verified by our licensed pharmacist before dispensing.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept Telebirr, CBE Birr, cash on delivery, and major bank cards through our secure payment gateway.",
  },
  {
    q: "How do I track my order?",
    a: "Visit 'My Active Orders' in the portal to see real-time order status from placement through to pickup/delivery.",
  },
  {
    q: "What if my medication is out of stock?",
    a: "You'll be notified immediately. You can request a back-order alert or consult with our pharmacist for an equivalent alternative.",
  },
];

export default function SupportPage() {
  return (
    <AppShell requiredRole="customer">
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pharmacy Support</h1>
          <p className="text-sm text-muted">Get help with your orders, prescriptions, and account.</p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Phone, label: "Call Us", value: "+251 11 234 5678", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/25" },
            { icon: Mail, label: "Email Support", value: "support@alemp.et", color: "text-teal-400", bg: "bg-teal-500/15 border-teal-500/25" },
            { icon: MessageCircle, label: "Live Chat", value: "Available 8AM–9PM", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/25" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center ${bg}`}>
              <Icon className={`h-6 w-6 ${color}`} />
              <p className="text-xs font-bold text-foreground">{label}</p>
              <p className={`text-xs ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Business Hours */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 pb-3">
            <Clock className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-foreground">Business Hours</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {[
              { day: "Monday – Friday", hours: "8:00 AM – 9:00 PM" },
              { day: "Saturday",        hours: "9:00 AM – 7:00 PM" },
              { day: "Sunday",          hours: "10:00 AM – 5:00 PM" },
            ].map(({ day, hours }) => (
              <div key={day} className="flex justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <span className="text-muted">{day}</span>
                <span className="font-medium text-foreground">{hours}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emergency Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">
            <span className="font-bold">Medical Emergency?</span> Call <span className="font-bold">907</span> (Ethiopian Emergency) or visit the nearest hospital. Do not rely on this portal for emergency medications.
          </p>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {FAQS.map((faq, i) => (
              <details key={i} className="group py-3 cursor-pointer">
                <summary className="flex items-center justify-between gap-3 list-none text-sm font-semibold text-foreground hover:text-emerald-300 transition-colors">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-2 text-xs text-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </CardContent>
        </Card>

        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
          <MessageCircle className="h-4 w-4" />
          Start Live Chat Session
        </Button>
      </div>
    </AppShell>
  );
}

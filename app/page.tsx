"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, MapPin, Phone, Clock, Mail, Pill, Stethoscope, HeartPulse, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="relative min-h-screen antialiased"
      style={{
        backgroundColor: "#0b1320",
        color: "#f1f5f9",
        fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Full-screen background image */}
      <div className="fixed inset-0" style={{ zIndex: -20 }}>
        <Image
          src="/1.jpeg"
          alt="Alem Pharmacy interior"
          fill
          priority
          className="object-cover"
          style={{ opacity: 0.25 }}
        />
      </div>

      {/* Blur / dark overlay for readability */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: -10,
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          backgroundColor: "rgba(11,19,32,0.55)",
        }}
      />

      {/* Navigation with Logo */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: "rgba(11,19,32,0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="relative overflow-hidden rounded-xl border"
              style={{
                width: 36,
                height: 36,
                borderColor: "rgba(16,185,129,0.25)",
                backgroundColor: "rgba(16,185,129,0.15)",
              }}
            >
              <Image
                src="/logo.jpeg"
                alt="Alem Pharmacy Logo"
                width={36}
                height={36}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "#f1f5f9" }}>
              Alem Pharmacy
            </span>
          </Link>

          {/* Desktop nav buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-5 py-2 text-sm font-medium transition-colors"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f1f5f9",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#059669" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
            >
              Sign up
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" style={{ color: "#94a3b8" }} />
            ) : (
              <Menu className="h-5 w-5" style={{ color: "#94a3b8" }} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="border-t px-4 py-4 md:hidden"
            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(11,19,32,0.95)" }}
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "#059669" }}
                onClick={() => setMobileOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero / About Section */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border"
                style={{
                  borderColor: "rgba(16,185,129,0.25)",
                  backgroundColor: "rgba(16,185,129,0.1)",
                  color: "#34d399",
                }}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Trusted Neighborhood Pharmacy
              </div>
              <h1
                className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "#f1f5f9" }}
              >
                Alem Pharmacy
                <span
                  className="block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(to right, #34d399, #2dd4bf)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Your Health, Our Priority
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: "#94a3b8" }}>
                Serving the community with compassionate care, reliable medications, and trusted health guidance.
                Visit us for prescription filling, over-the-counter remedies, and personalized pharmacist consultations.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: "#059669", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#10b981";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#059669";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.2)";
                  }}
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Pharmacy info card */}
            <div
              className="rounded-2xl border p-6 shadow-xl"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#131c2e",
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#f1f5f9" }}>
                Visit Our Pharmacy
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5" style={{ color: "#34d399" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>Location</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>Addis Ababa, Ethiopia</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 mt-0.5" style={{ color: "#34d399" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>Opening Hours</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>Mon - Sat: 8:00 AM - 10:00 PM</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>Sunday: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5" style={{ color: "#34d399" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>Phone</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>+251 911 234 567</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5" style={{ color: "#34d399" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>Email</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>info@alempharmacy.et</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#f1f5f9" }}>
              Our Services
            </h2>
            <p className="mt-4 text-lg" style={{ color: "#94a3b8" }}>
              Comprehensive pharmacy services tailored to your health needs.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#131c2e",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(16,185,129,0.2)",
                  backgroundColor: "rgba(16,185,129,0.1)",
                }}
              >
                <Pill className="h-6 w-6" style={{ color: "#34d399" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>
                Prescription Filling
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Fast, accurate prescription dispensing with automated verification and patient counseling.
              </p>
            </div>

            <div
              className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#131c2e",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(20,184,166,0.2)",
                  backgroundColor: "rgba(20,184,166,0.1)",
                }}
              >
                <Stethoscope className="h-6 w-6" style={{ color: "#2dd4bf" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>
                Clinical Consultations
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                One-on-one consultations with our licensed pharmacists for medication therapy management.
              </p>
            </div>

            <div
              className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#131c2e",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(59,130,246,0.2)",
                  backgroundColor: "rgba(59,130,246,0.1)",
                }}
              >
                <HeartPulse className="h-6 w-6" style={{ color: "#60a5fa" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>
                Health Screenings
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Blood pressure, glucose, and cholesterol monitoring to help you stay on top of your health.
              </p>
            </div>

            <div
              className="rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#131c2e",
              }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "rgba(168,85,247,0.2)",
                  backgroundColor: "rgba(168,85,247,0.1)",
                }}
              >
                <ShieldCheck className="h-6 w-6" style={{ color: "#a855f7" }} />
              </div>
              <h3 className="text-lg font-semibold" style={{ color: "#f1f5f9" }}>
                Immunizations
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
                Routine vaccines and immunizations administered by certified healthcare professionals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About / Trust Section */}
      <section className="py-16 sm:py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#f1f5f9" }}>
                About Alem Pharmacy
              </h2>
              <p className="mt-4 text-lg" style={{ color: "#94a3b8" }}>
                Founded on the belief that every patient deserves personalized, reliable, and accessible pharmacy care.
                Our team of dedicated pharmacists and support staff work together to ensure you receive the right medication,
                the right guidance, and the right support every time you walk through our doors.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div
                  className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "#131c2e",
                  }}
                >
                  <ShieldCheck className="h-4 w-4" style={{ color: "#34d399" }} />
                  <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                    Licensed & Certified
                  </span>
                </div>
                <div
                  className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "#131c2e",
                  }}
                >
                  <HeartPulse className="h-4 w-4" style={{ color: "#34d399" }} />
                  <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                    Patient-Centered Care
                  </span>
                </div>
                <div
                  className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "#131c2e",
                  }}
                >
                  <Pill className="h-4 w-4" style={{ color: "#34d399" }} />
                  <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                    Wide Medication Range
                  </span>
                </div>
                <div
                  className="flex items-center gap-2.5 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    backgroundColor: "#131c2e",
                  }}
                >
                  <Stethoscope className="h-4 w-4" style={{ color: "#34d399" }} />
                  <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                    Expert Pharmacists
                  </span>
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl border p-6 shadow-xl"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "#131c2e",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#94a3b8" }}
                  >
                    Community Rating
                  </p>
                  <p className="mt-2 text-4xl font-extrabold" style={{ color: "#f1f5f9" }}>
                    4.9<span style={{ color: "#34d399" }}>/5</span>
                  </p>
                </div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#34d399" }}
                >
                  <HeartPulse className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  "Trusted by thousands of patients",
                  "Fast prescription turnaround",
                  "Friendly, knowledgeable staff",
                  "Convenient location and hours",
                ].map((line, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#34d399" }} />
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-16 sm:px-12 sm:py-20"
            style={{
              border: "1px solid rgba(16,185,129,0.2)",
              background:
                "linear-gradient(to bottom right, rgba(6,78,59,0.5), #0b1320, rgba(6,78,59,0.4))",
            }}
          >
            <div
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full"
              style={{ backgroundColor: "rgba(16,185,129,0.1)", filter: "blur(64px)" }}
            />
            <div
              className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full"
              style={{ backgroundColor: "rgba(20,184,166,0.1)", filter: "blur(64px)" }}
            />

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#f1f5f9" }}>
                Need a Prescription Filled?
              </h2>
              <p className="mt-4 text-lg" style={{ color: "#94a3b8" }}>
                Create an account to order medications online, upload prescriptions, and track your orders.
                Or visit us in person for immediate service.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: "#059669", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.25)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#f1f5f9" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0f172a" }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div
                  className="relative overflow-hidden rounded-xl border"
                  style={{
                    width: 32,
                    height: 32,
                    borderColor: "rgba(16,185,129,0.25)",
                    backgroundColor: "rgba(16,185,129,0.15)",
                  }}
                >
                  <Image
                    src="/logo.jpeg"
                    alt="Alem Pharmacy Logo"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
                <span className="text-base font-bold" style={{ color: "#f1f5f9" }}>
                  Alem Pharmacy
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm" style={{ color: "#94a3b8" }}>
                Your trusted neighborhood pharmacy. Quality medications, expert advice, and caring service since day one.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Services</h3>
              <ul className="mt-4 space-y-2.5">
                {["Prescriptions", "Consultations", "Immunizations", "Health Screenings"].map((item) => (
                  <li key={item}>
                    <span className="text-sm" style={{ color: "#94a3b8" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Contact</h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <span className="text-sm flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <MapPin className="h-3.5 w-3.5" /> Addis Ababa, Ethiopia
                  </span>
                </li>
                <li>
                  <span className="text-sm flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <Phone className="h-3.5 w-3.5" /> +251 911 234 567
                  </span>
                </li>
                <li>
                  <span className="text-sm flex items-center gap-2" style={{ color: "#94a3b8" }}>
                    <Mail className="h-3.5 w-3.5" /> info@alempharmacy.et
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="mt-12 flex flex-col items-center justify-between gap-4 pt-8 md:flex-row"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              © 2026 Alem Pharmacy. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
              <ShieldCheck className="h-3 w-3" style={{ color: "#34d399" }} />
              Licensed Pharmacy · Trusted Care
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

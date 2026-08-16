"use client";

import Link from "next/link";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

const STEPS = [
  {
    icon: "car",
    title: "Choose your car",
    description: "Browse verified listings and pick a car that fits your trip.",
  },
  {
    icon: "check-circle",
    title: "Book & verify",
    description: "Review the price, confirm your details, and reserve it.",
  },
  {
    icon: "briefcase",
    title: "Pick up your car",
    description: "Meet the owner, do a quick handover, and hit the road.",
  },
] as const;

const WHY_QENT = [
  {
    icon: "car",
    title: "Wide variety of vehicles",
    description: "From city hatchbacks to full-size SUVs, listed by verified owners near you.",
  },
  {
    icon: "user",
    title: "Owners you can trust",
    description: "Every owner goes through a verification review before they can list a car.",
  },
  {
    icon: "briefcase",
    title: "Flexible rental plans",
    description: "Rent by the day, the week, or longer — pricing is set by each owner.",
  },
  {
    icon: "check-circle",
    title: "Simple, transparent booking",
    description: "See price, availability, and owner details up front before you commit.",
  },
] as const;

const NAV_LINKS = [
  { href: "#steps", label: "Steps" },
  { href: "#about", label: "About" },
  { href: "#why", label: "Why Qent" },
] as const;

const HOME_BACKGROUND_CARS = [
  {
    src: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f697.png",
    alt: "Transparent car illustration",
    left: "-6%",
    bottom: "-8%",
    width: 260,
    opacity: 0.95,
    transform: "rotate(-12deg)",
  },
  {
    src: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f699.png",
    alt: "Transparent car illustration",
    right: "-4%",
    top: "-6%",
    width: 240,
    opacity: 0.84,
    transform: "rotate(12deg)",
  },
] as const;

export default function HomeScreen({ profile }: { profile: UserProfile | null }) {
  return (
    <AppScreen profile={profile}>
      <div style={{ background: "#f8f8f8" }}>
        {/* Hero */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "32px 20px 48px",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 1180,
              margin: "0 auto",
              borderRadius: 36,
              minHeight: "72vh",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              padding: "40px 24px 40px",
              background: "linear-gradient(135deg, #08111f 0%, #16253e 55%, #29415c 100%)",
              boxShadow: "0 30px 90px rgba(15, 23, 42, 0.28)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at top left, rgba(255,255,255,0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(255,255,255,0.14), transparent 28%)",
              }}
            />

            {HOME_BACKGROUND_CARS.map((car, index) => (
              <img
                key={`${car.src}-${index}`}
                src={car.src}
                alt={car.alt}
                style={{
                  position: "absolute",
                  left: (car as any).left,
                  right: (car as any).right,
                  top: (car as any).top,
                  bottom: (car as any).bottom,
                  width: (car as any).width,
                  opacity: (car as any).opacity,
                  pointerEvents: "none",
                  filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.45))",
                  transform: (car as any).transform,
                }}
              />
            ))}

            <div style={{ position: "relative", zIndex: 1, maxWidth: 620, width: "100%" }}>
              <p
                style={{
                  margin: 0,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.74)",
                }}
              >
                Premium car sharing
              </p>
              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.08,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                }}
              >
                Find your next ride or welcome guests into your own fleet.
              </h1>
              <p
                style={{
                  margin: "18px 0 0",
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.85)",
                  maxWidth: 520,
                }}
              >
                Browse premium vehicles for your next trip, or sign up to list your own cars and grow your rental business.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
                <Link
                  href="/browse"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "13px 22px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.9)",
                    background: "transparent",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Browse Cars
                </Link>
                <Link
                  href="/signup"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "13px 22px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.78)",
                    background: "transparent",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Steps to Rent */}
        <section id="steps" className="border-t" style={{ borderColor: "#d7d7d7" }}>
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8">
            <div className="mb-10 text-center">
              <p
                className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]"
                style={{ color: "#3b82f6" }}
              >
                How it works
              </p>
              <h2 className="text-[28px] font-semibold sm:text-[32px]" style={{ color: "#000000" }}>
                Steps to rent
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
                >
                  <span
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-semibold"
                    style={{ background: "#ededed", color: "#000000" }}
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-[16px] font-semibold" style={{ color: "#000000" }}>
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-t" style={{ borderColor: "#d7d7d7", background: "#ffffff" }}>
          <div className="mx-auto w-full max-w-[820px] px-5 py-16 text-center sm:px-8">
            <p
              className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "#3b82f6" }}
            >
              About Qent
            </p>
            <h2 className="text-[26px] font-semibold leading-snug sm:text-[30px]" style={{ color: "#000000" }}>
              Affordable, flexible car rentals from real owners
            </h2>
            <p className="mx-auto mt-4 max-w-[60ch] text-[15.5px] leading-relaxed" style={{ color: "#7f7f7f" }}>
              Looking for a reliable, budget-friendly way to get around? Qent connects you directly with verified
              vehicle owners in your area. Whether you need a car for a few hours, a weekend, or a few months, browse
              a range of listings and book the one that fits.
            </p>
          </div>
        </section>

        {/* Why Qent */}
        <section id="why" className="border-t" style={{ borderColor: "#d7d7d7" }}>
          <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8">
            <div className="mb-10 text-center">
              <p
                className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]"
                style={{ color: "#3b82f6" }}
              >
                Why choose us
              </p>
              <h2 className="text-[28px] font-semibold sm:text-[32px]" style={{ color: "#000000" }}>
                Why choose Qent?
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_QENT.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border p-6"
                  style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "#ededed" }}
                  >
                    <Icon name={item.icon as any} size={20} />
                  </div>
                  <h3 className="text-[15px] font-semibold leading-snug" style={{ color: "#000000" }}>
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section id="contact" className="border-t" style={{ borderColor: "#d7d7d7" }}>
          <div
            className="mx-auto my-10 w-full max-w-[1180px] rounded-3xl px-6 py-14 text-center sm:px-10"
            style={{ background: "#454545" }}
          >
            <h2 className="text-[26px] font-semibold sm:text-[30px]" style={{ color: "#ffffff" }}>
              Ready to hit the road?
            </h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed" style={{ color: "#ededed" }}>
              Browse available cars near you, or list your own and start earning as a Qent owner.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-[15px] font-medium transition-colors hover:opacity-90"
                style={{ background: "#ffffff", color: "#000000" }}
              >
                Browse cars
              </Link>
              <Link
                href="/become-owner"
                className="inline-flex items-center gap-2 rounded-lg border px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                style={{ borderColor: "#d7d7d7" }}
              >
                Become an owner
              </Link>
            </div>
          </div>
        </section>

        {/* Footer strip */}
        <footer className="border-t" style={{ borderColor: "#d7d7d7", background: "#ffffff" }}>
          <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-3 px-5 py-8 text-center sm:px-8">
            <nav className="flex flex-wrap justify-center gap-5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13.5px] font-medium transition-colors hover:opacity-70"
                  style={{ color: "#7f7f7f" }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/privacy-policy"
                className="text-[13.5px] font-medium transition-colors hover:opacity-70"
                style={{ color: "#7f7f7f" }}
              >
                Privacy policy
              </Link>
              <Link
                href="/terms"
                className="text-[13.5px] font-medium transition-colors hover:opacity-70"
                style={{ color: "#7f7f7f" }}
              >
                Terms
              </Link>
            </nav>
            <p className="text-[12.5px]" style={{ color: "#7f7f7f" }}>
              © {new Date().getFullYear()} Qent. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AppScreen>
  );
}
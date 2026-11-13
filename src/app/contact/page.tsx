"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PageContainer } from "@/components/PageContainer";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email address";
    if (!message.trim()) return "Message is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Contact] Submit triggered");
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      console.log("[Contact] Sending POST /api/contact");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website: honeypot }),
      });
      console.log("[Contact] Response status:", res.status);
      const data = await res.json();
      console.log("[Contact] Response body:", data);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send message");
      }

      setSuccess(data.message || "Message sent successfully!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      console.error("[Contact] Error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fieldClassName =
    "h-10 w-full rounded-xl border border-violet-200/80 bg-white/60 py-2 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100";

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f7f5ff] text-[#17203b] selection:bg-violet-200">
      <main className="relative flex flex-1 flex-col overflow-hidden pt-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_26%,rgba(255,255,255,.92),transparent_44%),radial-gradient(ellipse_at_90%_62%,rgba(220,204,255,.55),transparent_35%)]" />
          <svg
            className="absolute inset-x-0 bottom-0 h-32 w-full text-violet-500/20 sm:h-40"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0 72c114-39 178-12 282 18 98 29 177 20 270-8 104-31 172-26 263 5 87 30 180 33 267-1 116-45 222-31 358 14v60H0V72Z" opacity=".34" />
            <path d="M0 119h26V94l9-10 9 10v25h8V82l13-16 13 16v37h9V98h12v21h8v-35l15-18 15 18v35h16v-17h11v17h14v-29l10-12 10 12v29h22v-45l11-12 11 12v45h13v-24h13v24h19V96l12-14 12 14v23h16v-35l14-17 14 17v35h24v-18h12v18h18V90l14-16 14 16v29h22v-48l12-14 12 14v48h20V98l14-16 14 16v21h23V88l12-14 12 14v31h21v-21h13v21h24V92l13-14 13 14v27h26V82l15-18 15 18v37h21v-22h13v22h29V95l11-12 11 12v24h26V83l14-17 14 17v36h22V98l12-14 12 14v21h25V87l13-15 13 15v32h25V97l12-14 12 14v22h22V80l14-17 14 17v39h25V95l13-15 13 15v24h24V86l15-18 15 18v33h21V96l12-13 12 13v23h26V77l15-17 15 17v42h19V96l12-13 12 13v23h32v41H0v-41Z" opacity=".42" />
          </svg>
          <svg
            className="absolute -left-4 top-[39%] hidden h-36 w-28 text-green-700/25 sm:block"
            viewBox="0 0 112 144"
            fill="currentColor"
          >
            <path d="M4 144C18 99 42 57 94 9" fill="none" stroke="currentColor" strokeWidth="4" />
            <ellipse cx="22" cy="111" rx="8" ry="22" transform="rotate(-48 22 111)" />
            <ellipse cx="39" cy="82" rx="8" ry="23" transform="rotate(42 39 82)" />
            <ellipse cx="57" cy="55" rx="8" ry="22" transform="rotate(-48 57 55)" />
            <ellipse cx="77" cy="31" rx="7" ry="20" transform="rotate(42 77 31)" />
            <ellipse cx="90" cy="14" rx="7" ry="18" transform="rotate(-48 90 14)" />
          </svg>
          <svg
            className="absolute -right-5 bottom-8 hidden h-44 w-36 text-green-700/25 sm:block"
            viewBox="0 0 144 176"
            fill="currentColor"
          >
            <path d="M137 176C118 121 89 71 23 7" fill="none" stroke="currentColor" strokeWidth="4" />
            <ellipse cx="112" cy="143" rx="9" ry="25" transform="rotate(48 112 143)" />
            <ellipse cx="91" cy="112" rx="9" ry="25" transform="rotate(-42 91 112)" />
            <ellipse cx="68" cy="83" rx="9" ry="25" transform="rotate(48 68 83)" />
            <ellipse cx="44" cy="53" rx="8" ry="22" transform="rotate(-42 44 53)" />
            <ellipse cx="25" cy="24" rx="8" ry="21" transform="rotate(48 25 24)" />
          </svg>
        </div>

        <PageContainer className="relative z-10 flex w-full flex-1 flex-col">
          <section className="relative mb-6 min-h-[180px] overflow-hidden px-1 py-1 sm:min-h-[180px] sm:px-2 sm:py-1">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-8 hidden h-[260px] w-[52%] overflow-hidden rounded-bl-[45%] rounded-tl-[55%] xl:block"
            >
              <Image
                src="/images/districts/03_Gaya_Bodh_Gaya.jpg"
                alt="Mahabodhi Temple at Bodh Gaya, Bihar"
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 1024px) 55vw, 760px"
                className="object-cover object-[62%_top]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f5ff] via-[#f7f5ff]/20 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#f7f5ff]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#f7f5ff] to-transparent" />
            </div>
            <div aria-hidden="true" className="absolute -right-8 -top-2 hidden h-[190px] w-[45%] overflow-hidden rounded-bl-[45%] rounded-tl-[55%] md:block xl:hidden">
              <Image
                src="/images/districts/03_Gaya_Bodh_Gaya.jpg"
                alt=""
                fill
                sizes="(max-width: 1279px) 45vw, 760px"
                className="object-cover object-[62%_top]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f5ff] via-[#f7f5ff]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#f7f5ff] to-transparent" />
            </div>
            <div className="relative max-w-[660px] pt-1 md:max-w-[530px] xl:max-w-[660px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-300/40">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Contact Us
              </span>
              <h1 className="mt-3 text-[clamp(2rem,3.8vw,3rem)] font-black leading-[1.08] tracking-tight text-[#17203b]">
                Get in Touch <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-purple-500 bg-clip-text text-transparent">with Evigo</span>
              </h1>
              <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-slate-600 sm:text-base md:text-sm xl:text-base">
                Have questions, need support, or want to partner with us?
                <br className="hidden sm:block" />{" "}
                We&apos;re here to help you with your travel, event, and service needs across Bihar.
              </p>
              <div className="mt-4 h-1 w-16 rounded-full bg-violet-600" />
            </div>
            <div
              aria-hidden="true"
              className="relative mt-4 h-36 overflow-hidden rounded-[1.5rem] bg-cover md:hidden"
              style={{
                backgroundImage: "url('/images/districts/03_Gaya_Bodh_Gaya.jpg')",
                backgroundPosition: "60% 42%",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f5ff]/35 via-transparent to-[#f7f5ff]/10" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#f7f5ff]/60 to-transparent" />
            </div>
          </section>

          <section aria-label="Contact Evigo" className="mx-auto grid w-full max-w-[1000px] flex-1 content-start gap-5 md:grid-cols-[0.94fr_1fr] md:gap-6">
            <div className="relative isolate min-h-[376px] overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-violet-700 via-indigo-700 to-[#333b80] p-6 text-white shadow-[0_18px_42px_rgba(73,48,150,0.2)] sm:p-7">
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-0 h-[42%]">
                <Image
                  src="/images/districts/05_Nalanda.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, 500px"
                  className="object-cover object-[center_50%]"
                  style={{
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-violet-700/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-700/20 via-transparent to-indigo-950/10" />
              </div>
              <div className="relative z-10">
                <h2 className="text-[26px] font-extrabold leading-tight tracking-tight">Contact Information</h2>
                <p className="mt-1.5 text-sm text-white/90">Reach out to us through any of the following channels.</p>

                <div className="mt-5 flex flex-col gap-3.5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/30 text-white shadow-inner ring-1 ring-white/15">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold">Email</div>
                      <a href="mailto:support.evigo@gmail.com" className="break-all text-sm text-white/95 transition hover:text-white">
                        support.evigo@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/30 text-white shadow-inner ring-1 ring-white/15">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 8.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-bold">Phone</div>
                      <a href="tel:+917808807340" className="text-sm text-white/95 transition hover:text-white">
                        7808807340
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/30 text-white shadow-inner ring-1 ring-white/15">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-bold">Location</div>
                      <div className="text-sm text-white/95">Samastipur, Bihar, India</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form
              className="flex min-h-[376px] flex-col gap-2.5 rounded-[1.45rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_42px_rgba(63,47,122,0.11)] backdrop-blur-xl"
              onSubmit={handleSubmit}
            >
              <div>
                <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#17203b]">Send a Message</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Tell us how we can help you. Our team usually replies within 24 hours.</p>
              </div>

              {success && (
                <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              )}
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="relative">
                <label htmlFor="contact-name" className="sr-only">Your name</label>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5 20v-1a7 7 0 0 1 14 0v1H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  required
                  className={fieldClassName}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="contact-email" className="sr-only">Your email</label>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  required
                  className={fieldClassName}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="contact-message" className="sr-only">How can we help you?</label>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-600">
                  <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M8 11h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <textarea
                  id="contact-message"
                  required
                  className={`${fieldClassName} h-[88px] resize-y pt-3 pl-12`}
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-auto inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-5 py-3 font-bold text-white shadow-[0_8px_18px_rgba(112,60,205,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </section>

          <div aria-hidden="true" className="min-h-5 flex-1" />
        </PageContainer>
      </main>
    </div>
  );
}

"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth, UserRole } from "@/context/AuthContext";
import { createClient } from "@/lib/client";
import { getDashboardPath } from "@/lib/auth-role";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function LoginPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const { login } = useAuth();

  const role = useMemo<UserRole>(
    () => (params.role === "provider" ? "provider" : "client"),
    [params.role]
  );

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isProvider = role === "provider";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setError(null);
    setNotice(null);
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setStep("otp");
      setNotice(data.message || "OTP sent to your email.");
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpOverride?: string) => {
    setError(null);
    setNotice(null);
    const otpValue = otpOverride || otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpValue, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      if (!data.session?.access_token || !data.session?.refresh_token) {
        throw new Error("Login succeeded but the secure session could not be established. Please try again.");
      }
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) throw sessionError;
      
      setNotice("Login successful!");
      login(data.user);
      setTimeout(() => {
        router.replace(getDashboardPath(data.user.role));
      }, 800);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    
    if (digitsOnly.length > 1) {
      const pasted = digitsOnly.slice(0, 6);
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digitsOnly;
    setOtp(newOtp);

    if (digitsOnly && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const currentOtpStr = newOtp.join("");
    if (currentOtpStr.length === 6) {
       handleVerifyOtp(currentOtpStr);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      if (!submitting && otp.join("").length === 6) handleVerifyOtp();
    }
  };

  const isOtpComplete = otp.join("").length === 6;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
      {/* Main Container - Precise dimensions */}
      <div className="w-full max-w-[1600px] h-[calc(100dvh-48px)] min-h-[680px]">
        <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Panel - 42% width on desktop */}
          <div className="relative w-full lg:w-[42%] min-h-[250px] lg:min-h-full">
            <Image
              src="/images/districts/02_Patna.jpg"
              alt="Bihar Tourism - Patna Golghar"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-purple-800/50 to-indigo-900/60" />
            
            <div className="relative z-10 flex flex-col justify-between h-full p-6 lg:p-10">
              {/* Logo and Subtitle */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    ✦
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                      Evigo
                    </h1>
                    <p className="text-purple-100 text-sm lg:text-base font-medium">
                      Travel • Events • Stays • Local Services
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Cards - Vertical layout */}
              <div className="flex flex-col gap-3 my-4 lg:my-6">
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✈️</span>
                    <p className="text-white font-semibold text-sm lg:text-base">Travel & Tourism</p>
                  </div>
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <p className="text-white font-semibold text-sm lg:text-base">Events & Bookings</p>
                  </div>
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏨</span>
                    <p className="text-white font-semibold text-sm lg:text-base">Hotels & Venues</p>
                  </div>
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/30 flex items-center justify-between hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚕</span>
                    <p className="text-white font-semibold text-sm lg:text-base">FaabCab Transport</p>
                  </div>
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Main Headline */}
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 lg:mb-3 leading-tight">
                  Discover Bihar with Evigo
                </h2>
                <p className="text-purple-100 text-sm lg:text-base leading-relaxed">
                  Book travel, events, stays, and local services across Bihar – all in one place.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - 58% width on desktop */}
          <div className="w-full lg:w-[58%] bg-white flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-[680px]">
              {/* Back Button */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm mb-8 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>

              {/* Heading */}
              <div className="mb-10">
                <h1 className="text-[38px] lg:text-[42px] font-black text-gray-900 mb-3 leading-tight">
                  Login or Signup
                </h1>
                <p className="text-[16px] lg:text-[18px] text-gray-600">
                  Access bookings, explore destinations, and manage your services on Evigo.
                </p>
              </div>

              {/* Client/Provider Selection */}
              <div className="mb-8">
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => router.push("/login/client")}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                      !isProvider
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    I'm a Client
                  </button>
                  <button
                    onClick={() => router.push("/login/provider")}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                      isProvider
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    I'm a Service Provider
                  </button>
                </div>
              </div>

              {/* Form */}
              {step === "email" ? (
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold text-gray-700 mb-3"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !submitting && handleSendOtp()}
                        placeholder="name@example.com"
                        className="w-full pl-12 pr-4 py-4 rounded-lg border border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-[64px]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                      <span className="text-red-500">⚠️</span>
                      <span className="text-red-700 text-sm font-medium">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[58px]"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP…
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">OTP sent to:</p>
                    <p className="text-base font-bold text-purple-600">{email}</p>
                  </div>

                  {notice && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
                      <span className="text-green-500">✅</span>
                      <span className="text-green-700 text-sm font-medium">{notice}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 text-center">
                      ENTER 6-DIGIT OTP
                    </label>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onPaste={handlePaste}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                      <span className="text-red-500">⚠️</span>
                      <span className="text-red-700 text-sm font-medium">{error}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleVerifyOtp()}
                    disabled={submitting || !isOtpComplete}
                    className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[58px]"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      "Verify & Login"
                    )}
                  </button>
                  
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (resendTimer > 0 || submitting) return;
                        handleSendOtp();
                      }}
                      disabled={resendTimer > 0 || submitting}
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setOtp(["", "", "", "", "", ""]);
                        setNotice(null);
                        setError(null);
                        setResendTimer(0);
                      }}
                      className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Change Email
                    </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600">
                      💡 If no email arrives, check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                    </p>
                  </div>
                </div>
              )}

              {/* Terms and Privacy */}
              <div className="mt-10 text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our{" "}
                  <Link href="/terms-and-conditions" className="text-purple-600 hover:text-purple-700 font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-purple-600 hover:text-purple-700 font-medium">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

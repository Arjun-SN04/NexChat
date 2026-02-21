import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useAuth } from "../context/AuthProvider";

const Login = () => {
  const [, setAuthUser] = useAuth();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setServerError(""); setIsLoading(true);
    try {
      const res = await axios.post("/api/user/login", { email: data.email, password: data.password }, { withCredentials: true });
      localStorage.setItem("chatUser", JSON.stringify(res.data.user));
      setAuthUser(res.data.user);
    } catch (err) {
      setServerError(err.response?.data?.error || "Login failed. Try again.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left illustration panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-4 border border-white/20 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">A</div>
              <div className="bg-white/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-white text-sm">Hey! Are you there? 👋</div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse mb-4">
              <div className="w-8 h-8 rounded-full bg-pink-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">B</div>
              <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-indigo-700 text-sm font-medium">Yes! Let's catch up 🎉</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">A</div>
              <div className="bg-white/20 rounded-2xl rounded-tl-sm px-4 py-2.5 text-white text-sm">Perfect! Chat in real-time ⚡</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2.5 border border-white/20 w-fit mx-auto">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">2 people online right now</span>
          </div>
        </div>

        <div className="relative z-10 mt-10 text-center">
          <h2 className="text-3xl font-black text-white mb-2">Welcome back!</h2>
          <p className="text-indigo-200 text-sm">Your conversations are waiting for you.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 mb-8 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </div>
            <span className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition">ChatApp</span>
          </Link>

          <h1 className="text-3xl font-black text-slate-900 mb-1.5">Sign in</h1>
          <p className="text-slate-500 text-sm mb-8">Enter your credentials to access your account</p>

          {serverError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input type="email" placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition text-sm"
                {...register("email", { required: "Email is required" })} />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition text-sm"
                {...register("password", { required: "Password is required" })} />
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition shadow-sm text-sm mt-1">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  Signing in...
                </span>
              ) : "Sign in →"}
            </button>
          </form>

          {/* Go to Home button */}
          <div className="mt-4">
            <Link to="/home"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 font-semibold rounded-xl transition text-sm bg-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              Back to Home
            </Link>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

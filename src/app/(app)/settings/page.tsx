"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/auth";

export default function SettingsPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (next !== confirm) {
      setMessage({ ok: false, text: "New passwords don't match" });
      return;
    }

    startTransition(async () => {
      const result = await changePassword({ currentPassword: current, newPassword: next });
      if (result.success) {
        setMessage({ ok: true, text: "Password changed successfully" });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold text-panini-gold tracking-wide">SETTINGS</h1>
        <p className="text-panini-gray text-sm mt-1">Manage your account</p>
      </div>

      <div className="bg-panini-blue/10 border border-panini-blue/30 rounded-xl p-6 space-y-4">
        <h2 className="text-panini-white font-semibold">Change Password</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-panini-gray text-xs mb-1">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
            />
          </div>
          <div>
            <label className="block text-panini-gray text-xs mb-1">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
            />
          </div>
          <div>
            <label className="block text-panini-gray text-xs mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-panini-navy border border-panini-blue/50 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-gold"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-panini-red"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-panini-gold hover:bg-panini-gold-lt text-panini-navy font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

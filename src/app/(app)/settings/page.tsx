"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { changePassword, deleteAccount } from "@/lib/actions/auth";

export default function SettingsPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    startDeleteTransition(async () => {
      const result = await deleteAccount({ password: deletePassword });
      if (result.success) {
        await signOut({ callbackUrl: "/login" });
      } else {
        setDeleteError(result.error);
      }
    });
  }

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

      {/* Danger zone */}
      <div className="bg-panini-red/5 border border-panini-red/30 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-panini-red font-semibold">Delete Account</h2>
          <p className="text-panini-gray text-xs mt-1">
            Permanently delete your account, collection and all trades involving you. This cannot be
            undone.
          </p>
        </div>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="border border-panini-red/50 text-panini-red hover:bg-panini-red/10 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-3">
            <div>
              <label className="block text-panini-gray text-xs mb-1">
                Confirm with your password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                className="w-full bg-panini-navy border border-panini-red/40 rounded-lg px-3 py-2 text-panini-white text-sm focus:outline-none focus:border-panini-red"
              />
            </div>

            {deleteError && <p className="text-sm text-panini-red">{deleteError}</p>}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isDeleting}
                className="bg-panini-red hover:bg-panini-red/80 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                className="text-panini-gray hover:text-panini-white text-sm px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

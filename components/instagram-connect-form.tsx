"use client";

import { useEffect, useState, type FormEvent } from "react";
import { type InstagramHandle } from "@/lib/instagram-types";

export function InstagramConnectForm() {
  const [handle, setHandle] = useState<InstagramHandle>("s.ai.tories");
  const [secret, setSecret] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const status = params.get("status");
    if (connected) setMessage(`@${connected} is connected. Repeat for the other account.`);
    if (status === "failed") setMessage("The connection could not be completed. Check the selected account and Meta app settings.");
    if (status === "cancelled") setMessage("Instagram authorization was cancelled.");
  }, []);

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/instagram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, secret }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Unable to start connection");
      setSecret("");
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start connection");
      setBusy(false);
    }
  }

  return (
    <form className="connect-form" onSubmit={connect}>
      <label htmlFor="instagram-account">Creator account</label>
      <select id="instagram-account" value={handle} onChange={(event) => setHandle(event.target.value as InstagramHandle)}>
        <option value="s.ai.tories">@s.ai.tories</option>
        <option value="awwe.shit">@awwe.shit</option>
      </select>
      <label htmlFor="instagram-secret">Administrator secret</label>
      <input id="instagram-secret" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" required />
      <button type="submit" disabled={busy}>{busy ? "Opening Instagram…" : "Connect account ↗"}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}

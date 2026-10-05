import type { Metadata } from "next";
import { InstagramConnectForm } from "@/components/instagram-connect-form";

export const metadata: Metadata = { title: "Connect Instagram — Sai Avinash", robots: { index: false, follow: false } };

export default function InstagramAdminPage() {
  return (
    <main className="admin-page">
      <a className="brand" href="/">SA<span className="brand-dot">.</span></a>
      <div className="admin-panel">
        <p className="micro">Private setup / Instagram</p>
        <h1>Connect the<br /><em>moving pictures.</em></h1>
        <p>Use the administrator secret configured in Vercel. Connect each Creator account once; the site will refresh its reels automatically.</p>
        <InstagramConnectForm />
        <a className="admin-back" href="/">← Back to portfolio</a>
      </div>
    </main>
  );
}

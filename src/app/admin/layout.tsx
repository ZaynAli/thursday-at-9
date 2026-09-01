import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { getCurrentUser } from "@/lib/data";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-text-muted hover:text-lime transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Admin</h1>
          <p className="text-xs text-text-muted">Manage league operations</p>
        </div>
      </div>

      <AdminNav />

      {children}
    </div>
  );
}

import Link from "next/link";
import { Calendar, ClipboardList, ChevronRight, UserPlus } from "lucide-react";
import {
  getCurrentGameweek,
  getCurrentUser,
  getFantasyManagers,
  getPendingInvites,
  getPlayersWithoutProfile,
  getRosterPlayers,
} from "@/lib/data";
import { getDataSource } from "@/lib/data/config";

const sections = [
  {
    href: "/admin/players",
    title: "Roster & Invites",
    description: "Add players to roster, send manager invites from player pages",
    icon: UserPlus,
  },
  {
    href: "/admin/gameweek",
    title: "Weekly Session",
    description: "Select session players and notify managers to pick teams",
    icon: Calendar,
  },
  {
    href: "/admin/results",
    title: "Results",
    description: "Enter scores, stats, and publish gameweeks",
    icon: ClipboardList,
  },
];

export default async function AdminOverviewPage() {
  const [gameweek, managers, roster, pendingInvites, noProfile, user] =
    await Promise.all([
      getCurrentGameweek(),
      getFantasyManagers(),
      getRosterPlayers(),
      getPendingInvites(),
      getPlayersWithoutProfile(),
      getCurrentUser(),
    ]);

  const dataSource = getDataSource();

  return (
    <div className="space-y-6">
      <div className="surface-card p-4">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
          Admin · {user!.name}
          {dataSource === "supabase" && (
            <span className="ml-2 text-lime">· Live data</span>
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Roster" value={roster.length} />
          <Stat label="Fantasy managers" value={managers.length} />
          <Stat label="Pending invites" value={pendingInvites.length} />
          <Stat label="No profile yet" value={noProfile.length} />
        </div>
      </div>

      <div className="surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-text-muted uppercase tracking-wider">
              Current Gameweek
            </span>
            <p className="text-2xl font-bold tabular-nums mt-1">
              GW {String(gameweek.number).padStart(2, "0")}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-lime/15 text-lime border border-lime/30 capitalize">
            {gameweek.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-sm text-text-muted mt-2">
          {gameweek.availablePlayerIds.length} session players · {gameweek.format}{" "}
          · {managers.length} managers to notify
        </p>
      </div>

      <div className="space-y-2">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="surface-card p-4 flex items-center gap-4 hover:bg-surface-hover transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-lime/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-lime" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-lime transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

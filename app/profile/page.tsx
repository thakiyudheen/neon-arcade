"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/components/providers/app-providers";
import { getMatchHistory, getStatistics, resetAllLocal } from "@/lib/storage/profile";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { profile, settings } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [hist, setHist] = useState<any[]>([]);

  const load = () => {
    try {
      setStats(getStatistics());
      setHist(getMatchHistory());
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    if (!confirm("Reset all local data (profile, settings, stats, match history)? This cannot be undone.")) return;
    resetAllLocal();
    location.reload();
  };

  return (
    <main className="container py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Profile & Stats</h1>
        <p className="text-slate-400">Guest profile and local statistics. Local stats are specific to this browser and can be cleared by the user.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Guest Profile</CardTitle>
            <CardDescription>Automatically generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div><span className="text-slate-400">Name:</span> {profile?.name}</div>
            <div><span className="text-slate-400">Avatar:</span> {profile?.avatarId}</div>
            <div><span className="text-slate-400">Default target:</span> {settings?.defaultTarget}</div>
            <div><span className="text-slate-400">Preferred game:</span> {settings?.preferredGame}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>localStorage is local to this browser only</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={reset}>Reset local data</Button>
            <p className="mt-2 text-xs text-slate-500">Keys: mini-games:guest-profile:v1, settings:v1, statistics:v1, match-history:v1</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Local Statistics</CardTitle>
          <CardDescription>Not verified online leaderboard data</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Game</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
              </tr>
            </thead>
            <tbody>
              {stats && Object.entries(stats).map(([k,v]: any) => (
                <tr key={k} className="border-t border-white/5">
                  <td className="py-2">{k}</td>
                  <td>{v.matches}</td>
                  <td>{v.wins}</td>
                  <td>{v.losses}</td>
                  <td>{v.draws}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Match History</CardTitle>
          <CardDescription>Last 50 saved locally</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Game</th>
                <th>Mode</th>
                <th>Result</th>
                <th>Score</th>
                <th>Target</th>
                <th>Opponent</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {hist.map((h) => (
                <tr key={h.id} className="border-t border-white/5">
                  <td className="py-2">{h.gameId}</td>
                  <td>{h.mode}</td>
                  <td>{h.result}</td>
                  <td>{h.playerScore}-{h.opponentScore}</td>
                  <td>{h.target}</td>
                  <td>{h.opponentName}</td>
                  <td>{new Date(h.playedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}

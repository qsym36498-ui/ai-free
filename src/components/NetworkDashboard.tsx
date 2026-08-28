"use client";

import { useCallback, useEffect, useState } from "react";

interface NodeRow {
  alias: string;
  totalTokens: number;
  sessions: number;
  lastSeen: string;
}

interface NetworkData {
  nodes: number;
  networkTokens: number;
  sessions: number;
  top: NodeRow[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return "قبل " + minutes + " دقيقة";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return "قبل " + hours + " ساعة";
  return "قبل " + Math.floor(hours / 24) + " يوم";
}

export default function NetworkDashboard() {
  const [data, setData] = useState<NetworkData | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/nodes");
      setData((await response.json()) as NetworkData);
    } catch {
      /* نتجاهل */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- جلب أولي عند التحميل
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="rounded-xl border border-line bg-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 font-mono text-mint">⇄</span>
          <h3 className="text-lg font-bold text-fog">شبكة التدريب الموزعة — مباشر</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" />
          يتحدث كل 8 ثوانٍ
        </span>
      </div>

      {!data ? (
        <p className="font-mono text-xs text-faint">يحمّل حالة الشبكة...</p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-linesoft bg-panel2 p-3">
              <p className="font-mono text-xl font-bold text-mint">{data.nodes}</p>
              <p className="text-[11px] text-dim">عقدة تدريب (جهاز لاعب)</p>
            </div>
            <div className="rounded-lg border border-linesoft bg-panel2 p-3">
              <p className="font-mono text-xl font-bold text-mint">{data.networkTokens.toLocaleString("en")}</p>
              <p className="text-[11px] text-dim">توكن عالجتها الشبكة</p>
            </div>
            <div className="rounded-lg border border-linesoft bg-panel2 p-3">
              <p className="font-mono text-xl font-bold text-mint">{data.sessions.toLocaleString("en")}</p>
              <p className="text-[11px] text-dim">جلسة تدريب منفذة</p>
            </div>
          </div>

          {data.top.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold text-amber">أقوى العقد المساهمة</p>
              <ul className="space-y-1.5">
                {data.top.map((node, index) => (
                  <li
                    key={node.alias + index}
                    className="flex items-center justify-between rounded-lg border border-linesoft bg-panel2 px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-2 text-fog">
                      <span className="font-mono text-dim">#{index + 1}</span>
                      {node.alias}
                      <span className="text-faint">({timeAgo(node.lastSeen)})</span>
                    </span>
                    <span className="font-mono text-mint">
                      {node.totalTokens.toLocaleString("en")} توكن · {node.sessions} جلسة
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.top.length === 0 && (
            <p className="text-sm leading-7 text-dim">
              لا توجد عقد بعد — انضم أنت وكن أول سيرفر تدريب في الشبكة!
            </p>
          )}
        </>
      )}
    </div>
  );
}

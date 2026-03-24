"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface LogEntry {
  id: number;
  timestamp: string;
  type: string;
  request: {
    method: string;
    targetUrl: string;
    body?: string | null;
  };
  response: {
    status: number;
    isFake: boolean;
    body?: string;
    error?: string;
  };
}

const LOG_ITEM_HEIGHT = 110;
const BUFFER_SIZE = 5;
const SUMMARY_KEYS = ["category", "action", "intent", "url", "params", "page_id"];

function parseBody(body: string | null | undefined): Record<string, unknown> | null {
  if (!body) return null;
  try {
    let parsed = typeof body === "string" ? JSON.parse(body) : body;
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function extractSummary(body: string | null | undefined): Record<string, unknown> | null {
  const parsed = parseBody(body);
  if (!parsed) return null;
  const result: Record<string, unknown> = {};
  for (const key of SUMMARY_KEYS) {
    if (parsed[key] !== undefined) result[key] = parsed[key];
  }
  return Object.keys(result).length > 0 ? result : null;
}

function isImpressionLog(log: LogEntry): boolean {
  const parsed = parseBody(log.request.body);
  if (!parsed) return false;
  return (
    String(parsed.category || "").toLowerCase() === "impression" ||
    String(parsed.action || "").toLowerCase() === "impression"
  );
}

// 가상 스크롤 패널 컴포넌트
function LogPanel({
  title,
  logs,
  color,
  onClickLog,
}: {
  title: string;
  logs: LogEntry[];
  color: "blue" | "orange";
  onClickLog: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const virtualItems = useMemo(() => {
    const totalHeight = logs.length * LOG_ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / LOG_ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      logs.length,
      Math.ceil((scrollTop + containerHeight) / LOG_ITEM_HEIGHT) + BUFFER_SIZE
    );

    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({
        index: i,
        log: logs[i],
        style: {
          position: "absolute" as const,
          top: i * LOG_ITEM_HEIGHT,
          height: LOG_ITEM_HEIGHT,
          left: 0,
          right: 0,
        },
      });
    }

    return { items, totalHeight };
  }, [logs, scrollTop, containerHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 300 && status < 400) return "bg-yellow-100 text-yellow-800";
    if (status >= 400 && status < 500) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET": return "bg-blue-100 text-blue-800";
      case "POST": return "bg-green-100 text-green-800";
      case "PUT": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "PATCH": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const borderColor = color === "blue" ? "border-blue-300" : "border-orange-300";
  const headerBg = color === "blue" ? "bg-blue-50 text-blue-800" : "bg-orange-50 text-orange-800";

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <div className={`px-3 py-2 ${headerBg} rounded-t-lg border ${borderColor} border-b-0 flex justify-between items-center`}>
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs opacity-70">{logs.length} items</span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-auto border ${borderColor} rounded-b-lg bg-gray-50`}
        style={{ minHeight: 0 }}
      >
        <div style={{ height: virtualItems.totalHeight, position: "relative" }}>
          {virtualItems.items.map(({ log, style }) => (
            <div key={log.id} style={style} className="px-2 py-1">
              <div
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 h-full flex flex-col gap-1 cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all overflow-hidden"
                onClick={() => onClickLog(log.id)}
              >
                <div className="flex gap-2 items-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold min-w-14 text-center ${getMethodColor(log.request.method)}`}>
                    {log.request.method}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium min-w-10 text-center ${getStatusColor(log.response.status)}`}>
                    {log.response.status}
                  </span>
                  {log.response.isFake && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">FAKE</span>
                  )}
                  {log.response.error && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">ERR</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="text-xs font-mono text-gray-600 truncate">
                  {log.request.targetUrl}
                </span>
                {(() => {
                  const summary = extractSummary(log.request.body);
                  if (!summary) return null;
                  return (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      {Object.entries(summary).map(([key, value]) => (
                        <span key={key} className="text-gray-600">
                          <span className="font-medium text-gray-800">{key}:</span>{" "}
                          <span className="text-gray-500">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OhsLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const rafRef = useRef<number | null>(null);

  // 필터링
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!filter) return true;
      const searchLower = filter.toLowerCase();
      return (
        log.request.targetUrl?.toLowerCase().includes(searchLower) ||
        log.request.method?.toLowerCase().includes(searchLower) ||
        String(log.response.status).includes(searchLower)
      );
    });
  }, [logs, filter]);

  // 좌우 패널 분리
  const impressionLogs = useMemo(() => filteredLogs.filter(isImpressionLog), [filteredLogs]);
  const otherLogs = useMemo(() => filteredLogs.filter((log) => !isImpressionLog(log)), [filteredLogs]);

  // 배치 업데이트
  const flushPendingLogs = useCallback(() => {
    if (pendingLogsRef.current.length > 0) {
      const pending = [...pendingLogsRef.current];
      pendingLogsRef.current = [];
      setLogs((prev) => {
        const newLogs = [...pending.reverse(), ...prev];
        return newLogs.slice(0, 1000);
      });
    }
    rafRef.current = null;
  }, []);

  // SSE 연결
  useEffect(() => {
    if (isPaused) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      eventSource = new EventSource("http://localhost:3000/api/ohs-logs/stream");

      eventSource.onopen = () => setIsConnected(true);

      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data);
          if (log.type === "connected") return;

          pendingLogsRef.current.push(log);
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(flushPendingLogs);
          }
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPaused, flushPendingLogs]);

  // 초기 로그 로드
  useEffect(() => {
    fetch("http://localhost:3000/api/ohs-logs?limit=100")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch(console.error);
  }, []);

  const handleClearLogs = async () => {
    try {
      await fetch("http://localhost:3000/api/ohs-logs", { method: "DELETE" });
      setLogs([]);
    } catch (e) {
      console.error("Failed to clear ohs logs:", e);
    }
  };

  const handleClickLog = (id: number) => router.push(`/ohs-log/${id}`);

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">OHS Log</h1>
          <span
            className={`px-2 py-1 rounded text-sm ${
              isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className="text-sm text-gray-500">{filteredLogs.length} requests</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isPaused
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-yellow-600 text-white hover:bg-yellow-700"
            }`}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by URL, method, status..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 좌우 패널 */}
      <div className="flex-1 flex gap-4 min-h-0">
        <LogPanel
          title="Impression"
          logs={impressionLogs}
          color="blue"
          onClickLog={handleClickLog}
        />
        <LogPanel
          title="Others"
          logs={otherLogs}
          color="orange"
          onClickLog={handleClickLog}
        />
      </div>
    </div>
  );
}

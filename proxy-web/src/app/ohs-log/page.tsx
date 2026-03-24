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

const LOG_ITEM_HEIGHT = 140;
const BUFFER_SIZE = 5;

export default function OhsLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const rafRef = useRef<number | null>(null);

  // 필터링된 로그
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

  // 가상 스크롤링 계산
  const virtualItems = useMemo(() => {
    const totalHeight = filteredLogs.length * LOG_ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / LOG_ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      filteredLogs.length,
      Math.ceil((scrollTop + containerHeight) / LOG_ITEM_HEIGHT) + BUFFER_SIZE
    );

    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({
        index: i,
        log: filteredLogs[i],
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
  }, [filteredLogs, scrollTop, containerHeight]);

  // 배치 업데이트를 위한 함수
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

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data);

          if (log.type === "connected") {
            return;
          }

          pendingLogsRef.current.push(log);
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(flushPendingLogs);
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();

        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPaused, flushPendingLogs]);

  // 초기 로그 로드
  useEffect(() => {
    fetch("http://localhost:3000/api/ohs-logs?limit=100")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
      })
      .catch(console.error);
  }, []);

  // 컨테이너 높이 측정
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

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [filteredLogs.length, autoScroll]);

  // 스크롤 핸들러
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    const isNearTop = target.scrollTop < LOG_ITEM_HEIGHT * 2;
    setAutoScroll(isNearTop);
  }, []);

  // 로그 초기화
  const handleClearLogs = async () => {
    try {
      await fetch("http://localhost:3000/api/ohs-logs", { method: "DELETE" });
      setLogs([]);
    } catch (e) {
      console.error("Failed to clear ohs logs:", e);
    }
  };

  // HTTP 상태 코드 색상
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 300 && status < 400) return "bg-yellow-100 text-yellow-800";
    if (status >= 400 && status < 500) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // HTTP 메소드 색상
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "PATCH":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="h-full flex flex-col">
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
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by URL, method, status..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-black">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
      </div>

      {/* 가상 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-gray-50"
        style={{ minHeight: 0 }}
      >
        <div style={{ height: virtualItems.totalHeight, position: "relative" }}>
          {virtualItems.items.map(({ log, style }) => (
            <div key={log.id} style={style} className="px-2 py-1">
              <div
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 h-full flex flex-col gap-1 cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all overflow-hidden"
                onClick={() => router.push(`/ohs-log/${log.id}`)}
              >
                {/* 상단: Method, Status, URL, Timestamp */}
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold min-w-14 text-center ${getMethodColor(log.request.method)}`}>
                      {log.request.method}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium min-w-10 text-center ${getStatusColor(log.response.status)}`}>
                      {log.response.status}
                    </span>
                    {log.response.isFake && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        FAKE
                      </span>
                    )}
                    {log.response.error && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                        ERR
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono text-gray-700 truncate flex-1">
                    {log.request.targetUrl}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* 하단: Request Body / Response Body */}
                <div className="flex gap-2 flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-blue-600 font-medium">Req Body</span>
                    <pre className="text-xs text-gray-500 font-mono truncate mt-0.5 bg-blue-50 rounded px-2 py-1 overflow-hidden max-h-16">
                      {log.request.body || "-"}
                    </pre>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-green-600 font-medium">Res Body</span>
                    <pre className="text-xs text-gray-500 font-mono truncate mt-0.5 bg-green-50 rounded px-2 py-1 overflow-hidden max-h-16">
                      {log.response.body || "-"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

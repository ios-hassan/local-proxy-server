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

interface ParsedEvent {
  logId: number;
  timestamp: string;
  data: Record<string, unknown>;
}

const LOG_ITEM_HEIGHT = 110;
const BUFFER_SIZE = 5;
const SUMMARY_KEYS = ["category", "action", "intent", "url", "params", "page_id", "object_section", "object_sectionId", "object_section_idx", "object_id", "object_idx", "object_url"];

function parseBodyEvents(log: LogEntry): ParsedEvent[] {
  const body = log.request.body;
  if (!body) return [];
  try {
    let parsed = typeof body === "string" ? JSON.parse(body) : body;
    if (typeof parsed === "string") parsed = JSON.parse(parsed);

    // 배열이면 각 항목을 이벤트로
    if (Array.isArray(parsed)) {
      return parsed.map((item: Record<string, unknown>) => ({
        logId: log.id,
        timestamp: log.timestamp,
        data: item,
      }));
    }

    // data 키 안에 배열이 있으면
    if (parsed.data && Array.isArray(parsed.data)) {
      return parsed.data.map((item: Record<string, unknown>) => ({
        logId: log.id,
        timestamp: log.timestamp,
        data: item,
      }));
    }

    // 단일 객체
    return [{ logId: log.id, timestamp: log.timestamp, data: parsed }];
  } catch {
    return [];
  }
}

function extractEventSummary(data: Record<string, unknown>): Record<string, unknown> | null {
  const result: Record<string, unknown> = {};
  for (const key of SUMMARY_KEYS) {
    if (data[key] !== undefined) result[key] = data[key];
  }
  return Object.keys(result).length > 0 ? result : null;
}

function isImpressionEvent(data: Record<string, unknown>): boolean {
  return (
    String(data.category || "").toLowerCase() === "impression" ||
    String(data.action || "").toLowerCase() === "impression"
  );
}

// 가상 스크롤 패널 컴포넌트
function EventPanel({
  title,
  events,
  color,
  onClickEvent,
}: {
  title: string;
  events: ParsedEvent[];
  color: "blue" | "orange";
  onClickEvent: (id: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const virtualItems = useMemo(() => {
    const totalHeight = events.length * LOG_ITEM_HEIGHT;
    const startIndex = Math.max(0, Math.floor(scrollTop / LOG_ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      events.length,
      Math.ceil((scrollTop + containerHeight) / LOG_ITEM_HEIGHT) + BUFFER_SIZE
    );

    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({
        index: i,
        event: events[i],
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
  }, [events, scrollTop, containerHeight]);

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

  const borderColor = color === "blue" ? "border-blue-300" : "border-orange-300";
  const headerBg = color === "blue" ? "bg-blue-50 text-blue-800" : "bg-orange-50 text-orange-800";

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <div className={`px-3 py-2 ${headerBg} rounded-t-lg border ${borderColor} border-b-0 flex justify-between items-center`}>
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs opacity-70">{events.length} events</span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-auto border ${borderColor} rounded-b-lg bg-gray-50`}
        style={{ minHeight: 0 }}
      >
        <div style={{ height: virtualItems.totalHeight, position: "relative" }}>
          {virtualItems.items.map(({ event, style, index }) => {
            const summary = extractEventSummary(event.data);
            return (
              <div key={`${event.logId}-${index}`} style={style} className="px-2 py-1">
                <div
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 h-full flex flex-col gap-1 cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all overflow-hidden"
                  onClick={() => onClickEvent(event.logId)}
                >
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    {event.data.category != null && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                        {String(event.data.category)}
                      </span>
                    )}
                    {event.data.action != null && (
                      <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded text-xs font-medium">
                        {String(event.data.action)}
                      </span>
                    )}
                  </div>
                  {summary && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      {Object.entries(summary).map(([key, value]) => (
                        <span key={key} className="text-gray-500">
                          {key}: <span className="font-semibold text-gray-800">{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LogV2Page() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const pendingLogsRef = useRef<LogEntry[]>([]);
  const rafRef = useRef<number | null>(null);

  // 로그에서 이벤트 추출
  const allEvents = useMemo(() => {
    return logs.flatMap(parseBodyEvents);
  }, [logs]);

  // 필터링
  const filteredEvents = useMemo(() => {
    if (!filter) return allEvents;
    const searchLower = filter.toLowerCase();
    return allEvents.filter((event) => {
      const values = Object.values(event.data).map((v) => String(v).toLowerCase());
      return values.some((v) => v.includes(searchLower));
    });
  }, [allEvents, filter]);

  // 좌우 패널 분리
  const impressionEvents = useMemo(() => filteredEvents.filter((e) => isImpressionEvent(e.data)), [filteredEvents]);
  const otherEvents = useMemo(() => filteredEvents.filter((e) => !isImpressionEvent(e.data)), [filteredEvents]);

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
      eventSource = new EventSource("http://localhost:3000/api/log-v2-logs/stream");

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
    fetch("http://localhost:3000/api/log-v2-logs?limit=100")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch(console.error);
  }, []);

  const handleClearLogs = async () => {
    try {
      await fetch("http://localhost:3000/api/log-v2-logs", { method: "DELETE" });
      setLogs([]);
    } catch (e) {
      console.error("Failed to clear log-v2 logs:", e);
    }
  };

  const handleClickEvent = (logId: number) => router.push(`/log-v2/${logId}`);

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Log V2</h1>
          <span
            className={`px-2 py-1 rounded text-sm ${
              isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className="text-sm text-gray-500">{filteredEvents.length} events</span>
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
          placeholder="Search by any value..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 좌우 패널 */}
      <div className="flex-1 flex gap-4 min-h-0">
        <EventPanel
          title="Impression"
          events={impressionEvents}
          color="blue"
          onClickEvent={handleClickEvent}
        />
        <EventPanel
          title="Others"
          events={otherEvents}
          color="orange"
          onClickEvent={handleClickEvent}
        />
      </div>
    </div>
  );
}

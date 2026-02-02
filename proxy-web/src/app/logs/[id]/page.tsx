"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface LogEntry {
  id: number;
  timestamp: string;
  type: string;
  request: {
    method: string;
    targetUrl: string;
    baseUrl: string;
    path: string;
    query: string;
    headers: Record<string, string>;
    body: string | null;
  };
  response: {
    status: number;
    isFake: boolean;
    matchedApiId?: number;
    headers?: Record<string, string>;
    body?: string;
    error?: string;
  };
}

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/logs/${params.id}`);
        if (!res.ok) {
          throw new Error("로그를 찾을 수 없습니다.");
        }
        const data = await res.json();
        setLog(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [params.id]);

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

  // JSON 포맷팅
  const formatJson = (str: string | null | undefined) => {
    if (!str) return "";
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "로그를 찾을 수 없습니다."}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold">Log Detail</h1>
      </div>

      {/* 요약 정보 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded text-sm font-bold ${getMethodColor(log.request.method)}`}>
            {log.request.method}
          </span>
          <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(log.response.status)}`}>
            {log.response.status}
          </span>
          {log.response.isFake && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
              FAKE RESPONSE
            </span>
          )}
          {log.response.error && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
              ERROR
            </span>
          )}
          <span className="text-sm text-gray-400 ml-auto">
            {new Date(log.timestamp).toLocaleString()}
          </span>
        </div>
        <div className="font-mono text-sm text-gray-700 break-all">
          {log.request.targetUrl}
        </div>
      </div>

      {/* Request / Response 상세 */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-4 min-h-0">
          {/* Request */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-blue-700">Request</h2>

            {/* URL 정보 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">URL Info</h3>
              <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                <div><span className="text-gray-500">Base URL:</span> {log.request.baseUrl}</div>
                <div><span className="text-gray-500">Path:</span> {log.request.path}</div>
                {log.request.query && (
                  <div><span className="text-gray-500">Query:</span> {log.request.query}</div>
                )}
              </div>
            </div>

            {/* Headers */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Headers</h3>
              <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-48 text-gray-700">
                {JSON.stringify(log.request.headers, null, 2)}
              </pre>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Body</h3>
              {log.request.body ? (
                <pre className="bg-blue-50 rounded p-3 text-xs overflow-auto max-h-64 text-gray-700">
                  {formatJson(log.request.body)}
                </pre>
              ) : (
                <p className="text-gray-400 text-sm">No body</p>
              )}
            </div>
          </div>

          {/* Response */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
            <h2 className={`text-lg font-semibold mb-4 ${log.response.isFake ? "text-purple-700" : "text-green-700"}`}>
              Response {log.response.isFake && "(Fake)"}
            </h2>

            {/* Status */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Status</h3>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <span className={`px-2 py-1 rounded ${getStatusColor(log.response.status)}`}>
                  {log.response.status}
                </span>
                {log.response.matchedApiId && (
                  <span className="ml-3 text-gray-500">
                    Matched API ID: {log.response.matchedApiId}
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            {log.response.error && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Error</h3>
                <pre className="bg-red-50 rounded p-3 text-xs overflow-auto text-red-700">
                  {log.response.error}
                </pre>
              </div>
            )}

            {/* Headers */}
            {log.response.headers && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Headers</h3>
                <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto max-h-48 text-gray-700">
                  {JSON.stringify(log.response.headers, null, 2)}
                </pre>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Body</h3>
              {log.response.body ? (
                <pre className={`rounded p-3 text-xs overflow-auto max-h-64 text-gray-700 ${log.response.isFake ? "bg-purple-50" : "bg-green-50"}`}>
                  {formatJson(log.response.body)}
                </pre>
              ) : (
                <p className="text-gray-400 text-sm">No body</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

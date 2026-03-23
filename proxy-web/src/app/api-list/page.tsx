"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FakeResponse {
  name: string;
  body: string;
  isActive: boolean;
  statusCode?: number;
}

interface ProxyApi {
  id: number;
  baseUrl: string;
  path: string;
  query: string;
  body: string;
  delay: number | null;
  redirectUrl?: string;
  fakeResponses: FakeResponse[];
  createdAt: string;
}

export default function ApiListPage() {
  const router = useRouter();
  const [apiList, setApiList] = useState<ProxyApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDelayId, setEditingDelayId] = useState<number | null>(null);
  const [editingDelayValue, setEditingDelayValue] = useState<string>("");
  const [globalDelay, setGlobalDelay] = useState<number>(0);
  const [editingGlobalDelay, setEditingGlobalDelay] = useState(false);
  const [editingGlobalDelayValue, setEditingGlobalDelayValue] = useState<number>(0);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/delete-proxy-api/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApiList((prev) => prev.filter((api) => api.id !== id));
      } else {
        const error = await response.json();
        alert(error.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSwitchResponse = async (e: React.MouseEvent, apiId: number, responseIndex: number) => {
    e.stopPropagation();

    try {
      const response = await fetch(`http://localhost:3000/api/switch-response/${apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseIndex }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setApiList((prev) =>
          prev.map((api) => (api.id === apiId ? data : api))
        );
      }
    } catch (error) {
      alert("응답 전환 중 오류가 발생했습니다.");
    }
  };

  const handleDelayClick = (e: React.MouseEvent, api: ProxyApi) => {
    e.stopPropagation();
    setEditingDelayId(api.id);
    setEditingDelayValue(api.delay !== null ? String(api.delay) : "");
  };

  const handleDelaySave = async (e: React.MouseEvent | React.KeyboardEvent, apiId: number) => {
    e.stopPropagation();
    const delayValue = editingDelayValue.trim() === "" ? null : parseInt(editingDelayValue) || 0;
    try {
      const response = await fetch(`http://localhost:3000/api/update-delay/${apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delay: delayValue }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setApiList((prev) =>
          prev.map((api) => (api.id === apiId ? data : api))
        );
      }
    } catch (error) {
      alert("Delay 변경 중 오류가 발생했습니다.");
    }
    setEditingDelayId(null);
  };

  const handleDelayCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDelayId(null);
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/settings");
      if (response.ok) {
        const data = await response.json();
        setGlobalDelay(data.globalDelay || 0);
      }
    } catch {}
  };

  const handleGlobalDelaySave = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalDelay: editingGlobalDelayValue }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setGlobalDelay(data.globalDelay);
      }
    } catch {
      alert("Global Delay 변경 중 오류가 발생했습니다.");
    }
    setEditingGlobalDelay(false);
  };

  const fetchApiList = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/get-proxy-api-list");
      if (!response.ok) {
        throw new Error("API 목록을 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setApiList(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiList();
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">API List</h1>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">API List</h1>
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchApiList}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">API List</h1>
        <button
          onClick={() => { fetchApiList(); fetchSettings(); }}
          className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* Global Delay 설정 */}
      <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Global Delay:</span>
        {editingGlobalDelay ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editingGlobalDelayValue}
              onChange={(e) => setEditingGlobalDelayValue(parseInt(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGlobalDelaySave();
                if (e.key === "Escape") setEditingGlobalDelay(false);
              }}
              min={0}
              className="w-24 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <span className="text-xs text-gray-500">ms</span>
            <button
              onClick={handleGlobalDelaySave}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
            >
              OK
            </button>
            <button
              onClick={() => setEditingGlobalDelay(false)}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 cursor-pointer"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingGlobalDelay(true);
              setEditingGlobalDelayValue(globalDelay);
            }}
            className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors cursor-pointer ${
              globalDelay > 0
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
            }`}
          >
            {globalDelay > 0 ? `${globalDelay}ms` : "없음 (0ms)"}
          </button>
        )}
        <span className="text-xs text-gray-400">개별 API에 Delay가 설정되지 않은 경우 적용됩니다.</span>
      </div>

      {apiList.length === 0 ? (
        <p className="text-gray-600">등록된 API가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {apiList.map((api) => {
            const activeResponse = api.fakeResponses?.find((r) => r.isActive);
            return (
              <div
                key={api.id}
                onClick={() => router.push(`/api-edit/${api.id}`)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {api.baseUrl}
                  </span>
                  <span className="font-mono text-sm">{api.path}</span>
                </div>

                {api.query && (
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Query:</span> {api.query}
                  </div>
                )}

                {api.body && (
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Body:</span>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {api.body}
                    </pre>
                  </div>
                )}

                {/* Redirect URL 표시 */}
                {api.redirectUrl && (
                  <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-xs font-medium text-amber-700">Redirect:</span>
                    <span className="text-xs text-amber-600 ml-1 font-mono">{api.redirectUrl}</span>
                  </div>
                )}

                {/* Delay 배지 */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Delay:</span>
                  {editingDelayId === api.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingDelayValue}
                        onChange={(e) => setEditingDelayValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDelaySave(e, api.id);
                          if (e.key === "Escape") setEditingDelayId(null);
                        }}
                        placeholder="비우면 Global"
                        className="w-32 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <span className="text-xs text-gray-500">ms</span>
                      <button
                        onClick={(e) => handleDelaySave(e, api.id)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
                      >
                        OK
                      </button>
                      <button
                        onClick={handleDelayCancel}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDelayClick(e, api)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                        api.delay !== null
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {api.delay !== null ? `${api.delay}ms` : `Global (${globalDelay}ms)`}
                    </button>
                  )}
                </div>

                {/* Response 칩 목록 */}
                {api.fakeResponses && api.fakeResponses.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600 mr-2">Responses:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {api.fakeResponses.map((resp, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => handleSwitchResponse(e, api.id, idx)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                            resp.isActive
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {resp.isActive && "✓ "}{resp.name} ({resp.statusCode || 200})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 활성 Response 미리보기 */}
                {activeResponse && !api.redirectUrl && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Active Response ({activeResponse.name}):</span>
                    <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-x-auto max-h-32">
                      {activeResponse.body}
                    </pre>
                  </div>
                )}

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">
                    생성일: {new Date(api.createdAt).toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, api.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

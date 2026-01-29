"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProxyApi {
  id: number;
  baseUrl: string;
  path: string;
  query: string;
  body: string;
  fakeResponse: string;
  createdAt: string;
}

export default function ApiListPage() {
  const router = useRouter();
  const [apiList, setApiList] = useState<ProxyApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API List</h1>
        <button
          onClick={fetchApiList}
          className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors"
        >
          새로고침
        </button>
      </div>

      {apiList.length === 0 ? (
        <p className="text-gray-600">등록된 API가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {apiList.map((api) => (
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

              <div className="text-sm text-gray-600">
                <span className="font-medium">Fake Response:</span>
                <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-x-auto">
                  {api.fakeResponse}
                </pre>
              </div>

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
          ))}
        </div>
      )}
    </div>
  );
}

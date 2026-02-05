"use client";

import { useEffect, useState } from "react";

interface PresetSummary {
  total_types: number;
  types: Record<string, number>;
}

interface PresetTypeData {
  type: string;
  count: number;
  items: unknown[];
}

export default function MobilePresetPage() {
  const [summary, setSummary] = useState<PresetSummary | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [typeData, setTypeData] = useState<PresetTypeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeLoading, setTypeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/api/mobile-presets/summary");
      if (!response.ok) {
        throw new Error("Preset 데이터를 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeData = async (typeName: string) => {
    try {
      setTypeLoading(true);
      setSelectedType(typeName);
      setTypeData(null);
      const response = await fetch(`http://localhost:3000/api/mobile-presets/type/${encodeURIComponent(typeName)}`);
      if (!response.ok) {
        throw new Error(`타입 '${typeName}' 데이터를 가져오는데 실패했습니다.`);
      }
      const data = await response.json();
      setTypeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setTypeLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!typeData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(typeData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-black">MobileAPI Preset</h1>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-black">MobileAPI Preset</h1>
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchSummary}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-black">MobileAPI Preset</h1>
        <span className="text-sm text-gray-500">
          총 {summary?.total_types || 0}개 타입
        </span>
      </div>

      {/* 좌우 분할 레이아웃 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 왼쪽: 타입 버튼 목록 */}
        <div className="w-80 flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="font-medium text-black mb-2">타입 목록</div>
            <input
              type="text"
              placeholder="타입 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {summary?.types && (() => {
              const filteredTypes = Object.entries(summary.types)
                .filter(([typeName]) => typeName.toLowerCase().includes(searchQuery.toLowerCase()));

              if (filteredTypes.length === 0) {
                return (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    검색 결과가 없습니다
                  </div>
                );
              }

              return filteredTypes.map(([typeName, count]) => (
                <button
                  key={typeName}
                  onClick={() => fetchTypeData(typeName)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-100 transition-colors cursor-pointer ${
                    selectedType === typeName
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-black">{typeName}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                      {count}
                    </span>
                  </div>
                </button>
              ));
            })()}
          </div>
        </div>

        {/* 오른쪽: JSON 뷰어 */}
        <div className="flex-1 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          {selectedType ? (
            <>
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-black">{selectedType}</span>
                  {typeData && (
                    <span className="text-sm text-gray-600">{typeData.count}개 항목</span>
                  )}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!typeData}
                  className={`px-3 py-1 text-sm rounded transition-colors cursor-pointer ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-black"
                  }`}
                >
                  {copied ? "복사됨!" : "JSON 복사"}
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-900">
                {typeLoading ? (
                  <div className="text-gray-400">로딩 중...</div>
                ) : typeData ? (
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(typeData, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-400">데이터를 불러오는 중...</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <div className="text-lg mb-2">타입을 선택하세요</div>
                <div className="text-sm">왼쪽 목록에서 타입을 클릭하면<br/>JSON 데이터를 확인할 수 있습니다</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

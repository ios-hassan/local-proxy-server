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

interface SelectedItem {
  id: string;
  type: string;
  itemIndex: number;
  data: unknown;
  preview: string;
}

export default function MobilePresetPage() {
  const [summary, setSummary] = useState<PresetSummary | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [typeData, setTypeData] = useState<PresetTypeData | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeLoading, setTypeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedCopied, setGeneratedCopied] = useState(false);

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
      setSelectedItemIndex(null);
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

  const handleSelectItem = (index: number) => {
    setSelectedItemIndex(index);
  };

  const handleCopy = async () => {
    if (!typeData || selectedItemIndex === null) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(typeData.items[selectedItemIndex], null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const handleAddToList = () => {
    if (!typeData || selectedItemIndex === null || !selectedType) return;

    const item = typeData.items[selectedItemIndex];
    const id = `${selectedType}-${selectedItemIndex}-${Date.now()}`;

    // 중복 체크 (같은 타입, 같은 인덱스)
    const isDuplicate = selectedItems.some(
      (si) => si.type === selectedType && si.itemIndex === selectedItemIndex
    );

    if (isDuplicate) {
      alert("이미 추가된 아이템입니다.");
      return;
    }

    const newSelectedItem: SelectedItem = {
      id,
      type: selectedType,
      itemIndex: selectedItemIndex,
      data: item,
      preview: getItemPreview(item),
    };

    setSelectedItems((prev) => [...prev, newSelectedItem]);
  };

  const handleRemoveFromList = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGenerate = () => {
    if (selectedItems.length === 0) {
      alert("추가된 아이템이 없습니다.");
      return;
    }
    setShowGenerateModal(true);
  };

  const getGeneratedJson = () => {
    return selectedItems.map((item) => item.data);
  };

  const handleCopyGenerated = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getGeneratedJson(), null, 2));
      setGeneratedCopied(true);
      setTimeout(() => setGeneratedCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  const getItemPreview = (item: unknown): string => {
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      const id = obj.id || obj.Id || obj.ID;
      const name = obj.name || obj.Name || obj.title || obj.Title;
      const type = obj.type || obj.Type;

      const parts: string[] = [];
      if (id) parts.push(`id: ${id}`);
      if (name) parts.push(`${name}`);
      if (type && !parts.length) parts.push(`type: ${type}`);

      return parts.length > 0 ? parts.join(" - ") : "Object";
    }
    return String(item).substring(0, 30);
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

      {/* 상단: 가로형 리스트뷰 + 추가하기 버튼 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto min-h-[40px]">
          {selectedItems.length === 0 ? (
            <span className="text-gray-400 text-sm">선택된 아이템이 없습니다</span>
          ) : (
            selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg flex-shrink-0"
              >
                <div className="flex flex-col">
                  <span className="text-xs text-blue-600 font-medium">{item.type}</span>
                  <span className="text-xs text-gray-600 truncate max-w-[150px]">
                    #{item.itemIndex + 1} {item.preview}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFromList(item.id)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <button
          onClick={handleAddToList}
          disabled={selectedItemIndex === null || !typeData}
          className={`px-4 py-2 rounded-lg font-medium flex-shrink-0 cursor-pointer transition-colors ${
            selectedItemIndex !== null && typeData
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          추가하기
        </button>
        <button
          onClick={handleGenerate}
          disabled={selectedItems.length === 0}
          className={`px-4 py-2 rounded-lg font-medium flex-shrink-0 cursor-pointer transition-colors ${
            selectedItems.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          생성하기
        </button>
      </div>

      {/* 3단 분할 레이아웃 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 1단: 타입 목록 */}
        <div className="w-64 flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
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
                    <span className="font-medium text-sm text-black truncate">{typeName}</span>
                    <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full flex-shrink-0">
                      {count}
                    </span>
                  </div>
                </button>
              ));
            })()}
          </div>
        </div>

        {/* 2단: 아이템 목록 */}
        <div className="w-64 flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="font-medium text-black">
              {selectedType ? `${selectedType} 아이템` : "아이템 목록"}
            </div>
            {typeData && (
              <div className="text-xs text-gray-500 mt-1">{typeData.count}개 항목</div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {typeLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">로딩 중...</div>
            ) : typeData ? (
              typeData.items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectItem(index)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-100 transition-colors cursor-pointer ${
                    selectedItemIndex === index
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm text-black font-medium">Item #{index + 1}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {getItemPreview(item)}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                타입을 선택하세요
              </div>
            )}
          </div>
        </div>

        {/* 3단: JSON 뷰어 */}
        <div className="flex-1 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="font-medium text-black">
              {selectedItemIndex !== null ? `Item #${selectedItemIndex + 1} JSON` : "JSON 뷰어"}
            </div>
            {selectedItemIndex !== null && typeData && (
              <button
                onClick={handleCopy}
                className={`px-3 py-1 text-sm rounded transition-colors cursor-pointer ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                {copied ? "복사됨!" : "JSON 복사"}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 bg-gray-900">
            {selectedItemIndex !== null && typeData ? (
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(typeData.items[selectedItemIndex], null, 2)}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="mb-2">아이템을 선택하세요</div>
                  <div className="text-sm text-gray-600">
                    왼쪽에서 타입과 아이템을 선택하면<br/>JSON 데이터를 확인할 수 있습니다
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 생성하기 모달 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[80vw] h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-black">생성된 JSON</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedItems.length}개의 아이템이 합쳐졌습니다
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyGenerated}
                  className={`px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
                    generatedCopied
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-black"
                  }`}
                >
                  {generatedCopied ? "복사됨!" : "JSON 복사"}
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-black cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="flex-1 flex min-h-0">
              {/* 왼쪽: 아이템 순서 목록 */}
              <div className="w-64 border-r border-gray-200 flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-black text-sm">
                  아이템 순서
                </div>
                <div className="flex-1 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-black truncate">{item.type}</div>
                          <div className="text-xs text-gray-500 truncate">#{item.itemIndex + 1}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽: JSON 뷰어 */}
              <div className="flex-1 overflow-auto p-4 bg-gray-900">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {JSON.stringify(getGeneratedJson(), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

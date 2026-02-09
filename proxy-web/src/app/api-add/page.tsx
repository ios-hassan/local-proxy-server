"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FakeResponseItem {
  name: string;
  body: string;
  isActive: boolean;
}

export default function ApiAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    baseUrl: "",
    path: "",
    query: "",
    body: "",
  });
  const [fakeResponses, setFakeResponses] = useState<FakeResponseItem[]>([
    { name: "Default", body: "", isActive: true },
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    const baseUrl = searchParams.get("baseUrl");
    const path = searchParams.get("path");
    const query = searchParams.get("query");
    const body = searchParams.get("body");

    if (baseUrl || path || query || body) {
      setFormData((prev) => ({
        ...prev,
        baseUrl: baseUrl || "",
        path: path || "",
        query: query || "",
        body: body || "",
      }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponseNameChange = (index: number, name: string) => {
    setFakeResponses((prev) =>
      prev.map((r, i) => (i === index ? { ...r, name } : r))
    );
  };

  const handleResponseBodyChange = (index: number, body: string) => {
    setFakeResponses((prev) =>
      prev.map((r, i) => (i === index ? { ...r, body } : r))
    );
  };

  const handleSetActive = (index: number) => {
    setFakeResponses((prev) =>
      prev.map((r, i) => ({ ...r, isActive: i === index }))
    );
  };

  const handleAddResponse = () => {
    const newName = `Response ${fakeResponses.length + 1}`;
    setFakeResponses((prev) => [...prev, { name: newName, body: "", isActive: false }]);
    setActiveTabIndex(fakeResponses.length);
  };

  const handleDeleteResponse = (index: number) => {
    if (fakeResponses.length <= 1) return;
    const wasActive = fakeResponses[index].isActive;
    const newResponses = fakeResponses.filter((_, i) => i !== index);
    if (wasActive) {
      newResponses[0].isActive = true;
    }
    setFakeResponses(newResponses);
    if (activeTabIndex >= newResponses.length) {
      setActiveTabIndex(newResponses.length - 1);
    } else if (activeTabIndex === index) {
      setActiveTabIndex(Math.max(0, index - 1));
    }
  };

  const handleSave = async () => {
    if (!formData.baseUrl || !formData.path) {
      alert("Base URL, Path는 필수입니다.");
      return;
    }

    const hasBody = fakeResponses.some((r) => r.body.trim() !== "");
    if (!hasBody) {
      alert("최소 하나의 Fake Response에 내용을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/add-proxy-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, fakeResponses }),
      });

      if (response.ok) {
        alert("API가 저장되었습니다.");
        router.push("/api-list");
      } else {
        const error = await response.json();
        alert(error.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">API 추가</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Base URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            placeholder="https://api.example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="path"
            value={formData.path}
            onChange={handleChange}
            placeholder="/api/users"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Query <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            name="query"
            value={formData.query}
            onChange={handleChange}
            placeholder="id=1&name=test"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Body <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            placeholder='{"key": "value"}'
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Fake Responses 탭 영역 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Fake Responses <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* 탭 헤더 */}
            <div className="flex items-center bg-gray-50 border-b border-gray-300 overflow-x-auto">
              {fakeResponses.map((resp, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTabIndex(idx)}
                  className={`relative px-4 py-2 text-sm font-medium whitespace-nowrap border-r border-gray-300 transition-colors cursor-pointer ${
                    activeTabIndex === idx
                      ? "bg-white text-blue-600 border-b-2 border-b-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {resp.isActive && (
                    <span className="text-green-500 mr-1">●</span>
                  )}
                  {resp.name || `Response ${idx + 1}`}
                </button>
              ))}
              <button
                onClick={handleAddResponse}
                className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 text-lg font-bold cursor-pointer"
                title="새 Response 추가"
              >
                +
              </button>
            </div>

            {/* 탭 내용 */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Response 이름</label>
                  <input
                    type="text"
                    value={fakeResponses[activeTabIndex].name}
                    onChange={(e) => handleResponseNameChange(activeTabIndex, e.target.value)}
                    placeholder="Response 이름"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={() => handleSetActive(activeTabIndex)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      fakeResponses[activeTabIndex].isActive
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-green-50"
                    }`}
                  >
                    {fakeResponses[activeTabIndex].isActive ? "Active" : "Set Active"}
                  </button>
                  {fakeResponses.length > 1 && (
                    <button
                      onClick={() => handleDeleteResponse(activeTabIndex)}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Response Body</label>
                <textarea
                  value={fakeResponses[activeTabIndex].body}
                  onChange={(e) => handleResponseBodyChange(activeTabIndex, e.target.value)}
                  placeholder='{"success": true, "data": {}}'
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "저장 중..." : "Save"}
        </button>
      </div>
    </div>
  );
}

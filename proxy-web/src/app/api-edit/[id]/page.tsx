"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface FakeResponseItem {
  name: string;
  body: string;
  isActive: boolean;
}

export default function ApiEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    baseUrl: "",
    path: "",
    query: "",
    body: "",
  });
  const [fakeResponses, setFakeResponses] = useState<FakeResponseItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/get-proxy-api/${id}`);
        if (!response.ok) {
          throw new Error("API를 찾을 수 없습니다.");
        }
        const data = await response.json();
        setFormData({
          baseUrl: data.baseUrl,
          path: data.path,
          query: data.query || "",
          body: data.body || "",
        });
        if (data.fakeResponses && data.fakeResponses.length > 0) {
          setFakeResponses(data.fakeResponses);
          const activeIdx = data.fakeResponses.findIndex((r: FakeResponseItem) => r.isActive);
          setActiveTabIndex(activeIdx >= 0 ? activeIdx : 0);
        } else {
          setFakeResponses([{ name: "Default", body: "", isActive: true }]);
        }
      } catch (error) {
        alert("API를 불러오는데 실패했습니다.");
        router.push("/api-list");
      } finally {
        setLoading(false);
      }
    };

    fetchApi();
  }, [id, router]);

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

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/update-proxy-api/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, fakeResponses }),
      });

      if (response.ok) {
        alert("API가 수정되었습니다.");
        router.push("/api-list");
      } else {
        const error = await response.json();
        alert(error.error || "수정에 실패했습니다.");
      }
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">API 편집</h1>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">API 편집</h1>

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
            {fakeResponses.length > 0 && (
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
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/api-list")}
            className="flex-1 bg-gray-200 text-black py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

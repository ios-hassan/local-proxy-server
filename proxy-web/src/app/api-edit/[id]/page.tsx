"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ApiEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    baseUrl: "",
    path: "",
    query: "",
    body: "",
    fakeResponse: "",
  });
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
          fakeResponse: data.fakeResponse,
        });
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

  const handleSave = async () => {
    if (!formData.baseUrl || !formData.path || !formData.fakeResponse) {
      alert("Base URL, Path, Fake Response는 필수입니다.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/update-proxy-api/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Fake Response <span className="text-red-500">*</span>
          </label>
          <textarea
            name="fakeResponse"
            value={formData.fakeResponse}
            onChange={handleChange}
            placeholder='{"success": true, "data": {}}'
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

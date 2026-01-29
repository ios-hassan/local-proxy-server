"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApiAddPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    baseUrl: "",
    path: "",
    query: "",
    body: "",
    fakeResponse: "",
  });
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/add-proxy-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

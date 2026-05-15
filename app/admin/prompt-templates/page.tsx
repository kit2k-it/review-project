"use client";

import { useState, useEffect } from "react";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const DESCRIPTIONS: Record<string, string> = {
  "review-generator": "Prompt để generate review tự động cho mã QR",
  "hashtag-generator": "Prompt để generate keywords và hashtags cho công ty",
};

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/prompt-templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError("Không thể tải danh sách templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setEditContent(template.content);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSave = async () => {
    if (!editingId) return;

    const template = templates.find((t) => t.id === editingId);
    if (!template) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/prompt-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          content: editContent,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      await fetchTemplates();
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      setError("Không thể lưu template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quản lý Prompt Templates
        </h1>
        <p className="text-gray-600 mb-6">
          Chỉnh sửa prompt được sử dụng để generate review và hashtag tự động
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {template.description || DESCRIPTIONS[template.name]}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  v{template.version}
                </span>
              </div>

              {editingId === template.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900 font-mono text-sm"
                    placeholder="Nhập nội dung prompt..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Variables:{" "}
                    <code className="bg-gray-100 px-1 rounded">&lcub;&lcub;companyName&rcurly;</code>{" "}
                    <code className="bg-gray-100 px-1 rounded">&lcub;&lcub;category&rcurly;</code>{" "}
                    <code className="bg-gray-100 px-1 rounded">&lcub;&lcub;count&rcurly;</code>{" "}
                    <code className="bg-gray-100 px-1 rounded">&lcub;&lcub;address&rcurly;</code>{" "}
                    <code className="bg-gray-100 px-1 rounded">&lcub;&lcub;phone&rcurly;</code>{" "}
                    <code className="bg-gray-100 px-1 rounded">&lcub;&lcub;website&rcurly;</code>
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <pre className="bg-gray-50 p-3 rounded text-sm text-gray-800 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {template.content}
                  </pre>
                  <button
                    onClick={() => handleEdit(template)}
                    className="mt-3 text-blue-600 hover:underline text-sm"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400">
                Cập nhật: {new Date(template.updatedAt).toLocaleString("vi-VN")}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Chưa có prompt template nào. Vui lòng chạy database migration để tạo
              default templates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import axios from "axios";
import { useState } from "react";

export default function NoteForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const createNote = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return alert("Login dulu!");

    try {
      setLoading(true);

      // Buat note dulu
      const res = await axios.post(
        `http://localhost:8080/notes`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const noteId = res.data.id || res.data.note?.ID;
      if (!noteId) throw new Error("Gagal dapetin ID note");

      // Upload gambar (jika ada)
      if (files && files.length > 0) {
        for (const img of files) {
          const formData = new FormData();
          formData.append("file", img);
          formData.append("note_id", noteId);

          await axios.post(
            `http://localhost:8080/notes/image`, // disamain dengan backend
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }
      }

      setTitle("");
      setContent("");
      setFiles([]);
      await onCreated?.();
      alert("Note berhasil dibuat!");
    } catch (err) {
      console.error(err);
      alert("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={createNote} className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 placeholder-zinc-500 focus:border-blue-500 transition"
          placeholder="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white font-medium whitespace-nowrap ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : "Add Note"}
        </button>
      </div>

      <textarea
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200 placeholder-zinc-500 focus:border-blue-500 transition resize-none min-h-[100px]"
        placeholder="Tulis note baru..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="relative mt-2">
        <label className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 mr-2 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {files.length > 0 ? `${files.length} file(s) selected` : "Add Images"}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) =>
              setFiles((prev) => [...prev, ...Array.from(e.target.files)])
            }
            className="hidden"
          />
        </label>
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => setFiles([])}
            className="absolute right-2 top-2 text-zinc-400 hover:text-red-400 transition-colors"
            title="Clear all images"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {files.map((f, i) => (
            <img
              key={i}
              src={URL.createObjectURL(f)}
              className="w-20 h-20 object-cover rounded-lg border border-zinc-800"
            />
          ))}
        </div>
      )}
    </form>
  );
}

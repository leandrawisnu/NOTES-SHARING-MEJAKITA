"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import NoteForm from "@/components/NoteForm";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
    const res = await axios.get(`http://localhost:8080/notes`);
    setNotes(res.data.notes);
  };

  const deleteNote = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login dulu!");
    await axios.delete(`http://localhost:8080/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotes();
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Notes Sharing</h1>
      <NoteForm onCreated={fetchNotes} />

      <div className="grid gap-3 mt-6">
        {notes.map((note) => (
          <div
            key={note.ID}
            onClick={() => router.push(`/notes/${note.ID}`)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-start hover:bg-zinc-800 transition cursor-pointer"
          >
            <div>
              <p className="text-zinc-200 font-semibold">{note.title}</p>
              <p className="text-zinc-500">{note.content}</p>
            </div>

            {note.user_id ===
              JSON.parse(
                atob(localStorage.getItem("token")?.split(".")[1] || "{}")
              ).id && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // biar gak ikut trigger onClick card
                  if (confirm("Apakah anda ingin menghapus note ini?")) {
                    deleteNote(note.ID);
                  }
                }}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

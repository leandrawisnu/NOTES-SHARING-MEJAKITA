"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";

export default function NoteDetailPage() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(
          `localhost/notes/${id}`
        );
        setNote(res.data.note);
      } catch (err) {
        alert("Failed to load note");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  const deleteNote = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login dulu!");
    await axios.delete(`http://localhost:8080/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading note...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600">
        <p>Note not found 😢</p>
        <button
          onClick={() => router.push("/")}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isOwner =
    note.user_id ===
    JSON.parse(atob(localStorage.getItem("token")?.split(".")[1] || "{}")).id;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl p-8 w-full max-w-lg relative">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-blue-400">{note.title}</h1>
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Apakah anda ingin menghapus note ini?")) {
                  deleteNote(note.ID);
                }
              }}
              className="text-red-400 hover:bg-red-900/50 hover:text-red-300 p-1.5 rounded-full transition-colors -mt-1 -mr-1"
              title="Delete note"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
            {note.content}
          </p>
        </div>

        {console.log(note)}

        {note.images && note.images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {note.images.map((image) => (
                <div key={image.ID} className="relative group">
                  <img
                    src={image.url}
                    alt="Note attachment"
                    className="w-full h-32 object-cover rounded-lg border border-zinc-800 hover:border-blue-500 transition-colors"
                  />
                  {isOwner && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this image?')) {
                          try {
                            await axios.delete(
                              `localhost/notes/image/${image.ID}`,
                              {
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem('token')}`
                                }
                              }
                            );
                            router.push("/");
                          } catch (err) {
                            console.error('Failed to delete image', err);
                            alert('Failed to delete image');
                          }
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end items-center mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Back to notes
          </button>
        </div>
      </div>
    </div>
  );
}

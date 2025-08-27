import React, { useEffect, useRef, useState } from "react";

export const SongEditor = ({ songId, setSongId, onBack }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [verses, setVerses] = useState([{ text: "" }]);
  const [current, setCurrent] = useState(0);
  const editorRef = useRef(null);

  useEffect(() => {
    window.api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (songId) {
      window.api.getSong(songId).then((data) => {
        if (!data) return;
        setTitle(data.title);
        setCategory(data.category_code || "");
        setVerses(data.verses.length ? data.verses : [{ text: "" }]);
        setCurrent(0);
      });
    } else {
      setTitle("");
      setCategory(categories?.[0]?.code || "");
      setVerses([{ text: "" }]);
      setCurrent(0);
    }
  }, [songId, categories]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = verses[current]?.text || "";
    }
  }, [current, verses]);

  const handleInput = () => {
    const html = editorRef.current.innerHTML;
    setVerses((prev) =>
      prev.map((v, i) => (i === current ? { ...v, text: html } : v))
    );
  };

  const addVerse = () => {
    setVerses((prev) => {
      const arr = [...prev, { text: "" }];
      setCurrent(arr.length - 1);
      return arr;
    });
  };

  const handleSave = async () => {
    const payload = {
      id: songId,
      title,
      category_code: category,
      verses,
    };
    const res = await window.api.saveSong(payload);
    if (res?.id && setSongId) setSongId(res.id);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2 border-b border-gray-300">
        <button
          className="px-2 py-1 bg-gray-300 hover:bg-gray-200 rounded"
          onClick={() => onBack && onBack()}
        >
          Powrót
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 border-r border-gray-300 flex flex-col">
          <div className="p-2 border-b border-gray-300">
            <button
              className="px-2 py-1 bg-gray-300 hover:bg-gray-200 rounded"
              onClick={addVerse}
            >
              Dodaj slajd
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <ul>
              {verses.map((v, i) => (
                <li key={i}>
                  <button
                    className={`w-full text-left px-3 py-1 border-b border-gray-300 cursor-pointer hover:bg-gray-100 ${
                      current === i ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setCurrent(i)}
                  >
                    Zwrotka {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-1 border-r border-gray-300 flex flex-col">
          <div className="p-2 flex gap-2 items-center border-b border-gray-300">
            <input
              className="flex-1 border p-1"
              placeholder="Tytuł"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="border p-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="px-2 py-1 bg-green-300 hover:bg-green-200 rounded"
              onClick={handleSave}
            >
              Zapisz
            </button>
          </div>
          <div
            ref={editorRef}
            className="flex-1 p-2 overflow-auto"
            contentEditable
            onInput={handleInput}
          />
        </div>
        <div className="w-1/3 bg-black text-white p-4 overflow-auto">
          <div
            dangerouslySetInnerHTML={{
              __html: verses[current]?.text || "",
            }}
          />
        </div>
      </div>
    </div>
  );
};

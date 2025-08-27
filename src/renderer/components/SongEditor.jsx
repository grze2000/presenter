import React, { useEffect, useState } from "react";

export const SongEditor = ({ songId, setSongId, onBack }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [verses, setVerses] = useState([{ text: "" }]);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState(false);

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

  const handleInput = (e) => {
    const text = e.target.value;
    setVerses((prev) =>
      prev.map((v, i) => (i === current ? { ...v, text } : v))
    );
  };

  const addVerse = () => {
    setVerses((prev) => {
      const arr = [...prev, { text: "" }];
      setCurrent(arr.length - 1);
      return arr;
    });
  };

  const removeVerse = (index) => {
    if (!window.confirm("Usunąć tę zwrotkę?")) return;
    setVerses((prev) => {
      const arr = prev.filter((_, i) => i !== index);
      if (!arr.length) arr.push({ text: "" });
      const newCurrent = Math.min(current, arr.length - 1);
      setCurrent(newCurrent);
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const greenButtonStyle = {
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: 4,
    padding: "4px 8px",
  };

  const grayButtonStyle = {
    ...greenButtonStyle,
    backgroundColor: "#ccc",
    color: "#000",
  };

  const verseButtonStyle = (selected) => ({
    flex: 1,
    textAlign: "left",
    padding: "4px 12px",
    border: "none",
    borderBottom: "1px solid #ccc",
    cursor: "pointer",
    backgroundColor: selected ? "#e5e5e5" : "transparent",
  });

  const deleteButtonStyle = {
    padding: "0 8px",
    border: "none",
    borderBottom: "1px solid #ccc",
    cursor: "pointer",
    background: "transparent",
    color: "#f44336",
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-2" style={{ borderBottom: "1px solid #ccc" }}>
        <button style={grayButtonStyle} onClick={() => onBack && onBack()}>
          Wróć do listy pieśni
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-1/4 flex flex-col"
          style={{ borderRight: "1px solid #ccc" }}
        >
          <div className="p-2" style={{ borderBottom: "1px solid #ccc" }}>
            <button style={greenButtonStyle} onClick={addVerse}>
              Dodaj zwrotkę
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <ul>
              {verses.map((v, i) => (
                <li key={i}>
                  <div className="flex">
                    <button
                      style={verseButtonStyle(current === i)}
                      onClick={() => setCurrent(i)}
                    >
                      Zwrotka {i + 1}
                    </button>
                    <button
                      style={deleteButtonStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVerse(i);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="flex-1 flex flex-col"
          style={{ borderRight: "1px solid #ccc" }}
        >
          <div
            className="p-2 flex gap-2 items-center"
            style={{ borderBottom: "1px solid #ccc" }}
          >
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
            <button style={greenButtonStyle} onClick={handleSave}>
              Zapisz
            </button>
            {saved && <span style={{ color: '#16a34a' }}>Zapisano</span>}
          </div>
          <textarea
            className="flex-1 p-2 overflow-auto"
            value={verses[current]?.text || ""}
            onChange={handleInput}
          />
        </div>
        <div className="w-1/3 bg-black text-white p-4 overflow-auto">
          <div
            dangerouslySetInnerHTML={{
              __html: (verses[current]?.text || "").replace(/\n/g, "<br />"),
            }}
          />
        </div>
      </div>
    </div>
  );
};

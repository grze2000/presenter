import React, { useEffect, useState } from "react";
import CategoryList from "./CategoryList";
import SongList from "./SongList";
import SongView from "./SongView";

export default function DisplaySelector() {
  const [displays, setDisplays] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState("ad");
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [song, setSong] = useState(null);
  const [verse, setVerse] = useState(0);
  const [windowOpened, setWindowOpened] = useState(false);
  const [currentDisplayId, setCurrentDisplayId] = useState(null);

  useEffect(() => {
    window.api.getDisplays().then(async (list) => {
      setDisplays(list);
      const current = await window.api.getCurrentDisplayId?.();
      setCurrentDisplayId(current);
      setSelectedId(list?.[0]?.id);
    });

    window.api.onFullscreenClosed(() => {
      setWindowOpened(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSongId) {
      window.api.getSong(selectedSongId).then(setSong);
      setVerse(0);
    }
  }, [selectedSongId]);

  const sendContent = (index) => {
    setVerse(index);
    window.api.setFullscreenContent(song?.verses?.[index]?.text);
    console.log(
      `Sending content to display ${selectedId}: ${song?.verses?.[index]?.text}`
    );
  };

  const handlePresent = () => {
    if (selectedId && song) {
      setWindowOpened(true);
      window.api.openFullscreen(selectedId);
      window.api.setFullscreenContent(song?.verses?.[verse]?.text);
    }
  };

  return (
    <div className="flex">
      <CategoryList setCategory={setCategory} />
      <SongList category={category} setSelectedSongId={setSelectedSongId} />
      <SongView song={song} />
      <div style={{ padding: "1rem" }}>
        <h2>Wybierz wyświetlacz:</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {displays.map((d) => (
            <li key={d.id} style={{ margin: "8px 0" }}>
              <label>
                <input
                  type="radio"
                  name="display"
                  value={d.id}
                  checked={selectedId === d.id}
                  onChange={() => setSelectedId(d.id)}
                />{" "}
                Monitor {d.id} {d.id === currentDisplayId && "⭐"} –{" "}
                {d.size.width}×{d.size.height} @ ({d.bounds.x}, {d.bounds.y})
              </label>
            </li>
          ))}
        </ul>
        {windowOpened ? (
          <button
            onClick={() => {
              setWindowOpened(false);
              window.api.closeFullscreen();
            }}
          >
            Zakończ prezentację
          </button>
        ) : (
          <button onClick={handlePresent} disabled={!song || windowOpened}>
            Prezentuj
          </button>
        )}

        <button
          onClick={() => sendContent(verse - 1)}
          disabled={!selectedSongId || verse === 0}
        >
          Poprzednia zwrotka
        </button>
        <button
          onClick={() => sendContent(verse + 1)}
          disabled={!selectedSongId || verse === song?.verses?.length - 1}
        >
          Następna zwrotka
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";
import { LuPresentation } from "react-icons/lu";
import { PiRecordFill } from "react-icons/pi";
import { CategoryList } from "./components/CategoryList";
import { Schedule } from "./components/Schedule";
import { ScheduleList } from "./components/ScheduleList";
import { SongList } from "./components/SongList";
import { SongView } from "./components/SongView";

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!windowOpened) return;
      if (!song) return;

      // Przejdź do następnej zwrotki, jeśli jest dostępna
      if (event.code === "Space") {
        event.preventDefault(); // zapobiega scrollowaniu
        if (verse < song.verses.length - 1) {
          sendContent(verse + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [windowOpened, song, verse]);

  const [selectedTab, setSelectedTab] = useState("categories");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleSongs, setScheduleSongs] = useState([]);

  useEffect(() => {
    if (!selectedSchedule) return;
    window.api.getScheduleSongs(selectedSchedule.id).then(setScheduleSongs);
  }, [selectedSchedule]);

  const handleSongAdded = async () => {
    if (!selectedSchedule) return;
    const updated = await window.api.getScheduleSongs(selectedSchedule.id);
    setScheduleSongs(updated);
  };

  useEffect(() => {
    console.log("Selected schedule:", selectedSchedule);
  }, [selectedSchedule]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-gray-300">
          <div className="border-b border-gray-300 flex pt-1 px-1 gap-1">
            <button
              className={`py-1 px-2 border-l border-t border-r border-gray-300 bg-gray-200 text-sm cursor-pointer ${
                selectedTab === "categories" ? "bg-white" : ""
              }`}
              onClick={() => setSelectedTab("categories")}
            >
              Kategorie
            </button>
            <button
              className={`py-1 px-2 border-l border-t border-r border-gray-300 bg-gray-200 text-sm cursor-pointer ${
                selectedTab === "schedules" ? "bg-white" : ""
              }`}
              onClick={() => setSelectedTab("schedules")}
            >
              Harmonogramy
            </button>
          </div>
          {selectedTab === "categories" ? (
            <CategoryList setCategory={setCategory} />
          ) : selectedTab === "schedules" ? (
            <ScheduleList setSelectedSchedule={setSelectedSchedule} />
          ) : null}
        </div>
        <div className="flex-1 border-r border-gray-300 overflow-auto">
          <SongList
            category={category}
            setSelectedSongId={setSelectedSongId}
            selectedSchedule={selectedSchedule}
            onSongAdded={handleSongAdded}
          />
        </div>
        <div className="flex-2 flex flex-col">
          <div className="flex-1 bg-black text-white overflow-hidden">
            <SongView song={song} />
          </div>
          <div className="flex-1 flex">
            <Schedule
              selectedSchedule={selectedSchedule}
              scheduleSongs={scheduleSongs}
              setScheduleSongs={setScheduleSongs}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-300 p-2 flex justify-end gap-3">
        {windowOpened ? (
          <button
            className="mr-auto rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-red-400 hover:bg-red-300 transition-colors cursor-pointer"
            onClick={() => {
              setWindowOpened(false);
              window.api.closeFullscreen();
            }}
          >
            <PiRecordFill size={30} />
            Zakończ
          </button>
        ) : (
          <button
            onClick={handlePresent}
            disabled={!song || windowOpened}
            className="mr-auto rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-green-400 hover:bg-green-300 transition-colors cursor-pointer"
          >
            <LuPresentation size={30} />
            Prezentuj
          </button>
        )}

        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          disabled={!selectedSongId || verse === 0}
          title="Poprzednia pieśń"
        >
          <FaAngleDoubleLeft size={40} />
        </button>
        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          onClick={() => sendContent(verse - 1)}
          disabled={!selectedSongId || verse === 0}
          title="Poprzednia zwrotka"
        >
          <FaAngleLeft size={40} />
        </button>
        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          onClick={() => sendContent(verse + 1)}
          disabled={!selectedSongId || verse === song?.verses?.length - 1}
          title="Następna zwrotka"
        >
          <FaAngleRight size={40} />
        </button>
        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          disabled={!selectedSongId || verse === song?.verses?.length - 1}
          title="Następna pieśń"
        >
          <FaAngleDoubleRight size={40} />
        </button>
      </div>
      <div className="border-t border-gray-400 bg-gray-200 text-xs px-2 py-0.5">
        Prezentowanie xxx na wyświetlaczu{" "}
      </div>

      {/* 
      
      
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
        
      </div> */}
    </div>
  );
}

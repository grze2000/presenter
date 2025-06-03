import { useEffect, useState } from "react";
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
  const [selectedTab, setSelectedTab] = useState("categories");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleSongs, setScheduleSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

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

  const handlePresent = async () => {
    if (!selectedSchedule || !scheduleSongs.length || !selectedId) return;

    setWindowOpened(true);
    await window.api.openFullscreen(selectedId);
    setCurrentSongIndex(0);
    setCurrentVerseIndex(0);

    const song = await window.api.getSong(scheduleSongs[0].song_id);
    window.api.setFullscreenContent(song.verses[0].text);
  };

  const sendCurrent = async (
    songIndex = currentSongIndex,
    verseIndex = currentVerseIndex
  ) => {
    const songMeta = scheduleSongs[songIndex];
    if (!songMeta) return;
    const songData = await window.api.getSong(songMeta.song_id);
    const verse = songData.verses?.[verseIndex];
    if (verse) {
      window.api.setFullscreenContent(verse.text);
    }
  };

  useEffect(() => {
    const handleKeyDown = async (event) => {
      if (!windowOpened || !scheduleSongs.length) return;

      if (event.code === "Space" || event.code === "ArrowRight") {
        event.preventDefault();

        const current = await window.api.getSong(
          scheduleSongs[currentSongIndex].song_id
        );
        if (currentVerseIndex < current.verses.length - 1) {
          setCurrentVerseIndex((prev) => {
            const next = prev + 1;
            sendCurrent(currentSongIndex, next);
            return next;
          });
        } else if (currentSongIndex < scheduleSongs.length - 1) {
          const nextSong = currentSongIndex + 1;
          setCurrentSongIndex(nextSong);
          setCurrentVerseIndex(0);
          sendCurrent(nextSong, 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [windowOpened, currentSongIndex, currentVerseIndex, scheduleSongs]);

  const handleNextSong = async () => {
    if (currentSongIndex < scheduleSongs.length - 1) {
      const next = currentSongIndex + 1;
      setCurrentSongIndex(next);
      setCurrentVerseIndex(0);
      sendCurrent(next, 0);
    }
  };

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
            <button onClick={() => setSelectedTab("text")}>Notatki</button>
          </div>
          {selectedTab === "categories" ? (
            <CategoryList setCategory={setCategory} />
          ) : selectedTab === "schedules" ? (
            <ScheduleList setSelectedSchedule={setSelectedSchedule} />
          ) : null}
          {selectedTab === "text" && <TextTab />}
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
              currentSongId={scheduleSongs[currentSongIndex]?.song_id}
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
            disabled={
              !selectedSchedule ||
              !scheduleSongs.length ||
              !selectedId ||
              windowOpened
            }
            className="mr-auto rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-green-400 transition-colors cursor-pointer"
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
          onClick={handleNextSong}
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

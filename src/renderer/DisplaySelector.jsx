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
import { SongEditor } from "./components/SongEditor";

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
  const [currentText, setCurrentText] = useState("");
  const [currentSong, setCurrentSong] = useState(null);
  const [previewSong, setPreviewSong] = useState(null);
  const [previewVerseIndex, setPreviewVerseIndex] = useState(0);
  const [editorSongId, setEditorSongId] = useState(null);
  const [previousTab, setPreviousTab] = useState("categories");

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

  const sendCurrent = async (
    songIndex = currentSongIndex,
    verseIndex = currentVerseIndex
  ) => {
    const songMeta = scheduleSongs[songIndex];
    if (!songMeta) return;
    const songData = await window.api.getSong(songMeta.song_id);
    setCurrentSong(songData);
    const verse = songData.verses?.[verseIndex];
    if (verse) {
      window.api.setFullscreenContent(verse.text);
      setCurrentText(verse.text);
    }
  };

  const openPreview = async (songId) => {
    const data = await window.api.getSong(songId);
    setPreviewSong(data);
    setPreviewVerseIndex(0);
  };

  const openEditor = (songId = null) => {
    setEditorSongId(songId);
    setPreviousTab(selectedTab);
    setSelectedTab("editor");
  };

  const handlePreviewNext = () => {
    if (!previewSong) return;
    setPreviewVerseIndex((v) => Math.min(v + 1, previewSong.verses.length - 1));
  };

  const handlePreviewPrev = () => {
    if (!previewSong) return;
    setPreviewVerseIndex((v) => Math.max(v - 1, 0));
  };

  const handlePresent = async () => {
    if (!selectedSchedule || !scheduleSongs.length || !selectedId) return;

    setPreviewSong(null);
    setWindowOpened(true);
    await window.api.openFullscreen(selectedId);
    setCurrentSongIndex(0);
    setCurrentVerseIndex(0);
    sendCurrent(0, 0);
  };

  useEffect(() => {
    const handleAction = async (code) => {
      if (!windowOpened || !scheduleSongs.length) return;

      setPreviewSong(null);

      if (code === "Space" || code === "ArrowRight") {
        const current = await window.api.getSong(
          scheduleSongs[currentSongIndex].song_id
        );
        if (currentVerseIndex < current.verses.length - 1) {
          const next = currentVerseIndex + 1;
          setCurrentVerseIndex(next);
          sendCurrent(currentSongIndex, next);
        } else if (currentSongIndex < scheduleSongs.length - 1) {
          const nextSong = currentSongIndex + 1;
          setCurrentSongIndex(nextSong);
          setCurrentVerseIndex(0);
          sendCurrent(nextSong, 0);
        }
      } else if (code === "ArrowLeft") {
        if (currentVerseIndex > 0) {
          const prev = currentVerseIndex - 1;
          setCurrentVerseIndex(prev);
          sendCurrent(currentSongIndex, prev);
        } else if (currentSongIndex > 0) {
          const prevSong = currentSongIndex - 1;
          const prevSongData = await window.api.getSong(
            scheduleSongs[prevSong].song_id
          );
          const lastVerse = prevSongData.verses.length - 1;
          setCurrentSongIndex(prevSong);
          setCurrentVerseIndex(lastVerse);
          sendCurrent(prevSong, lastVerse);
        }
      } else if (code === "ArrowUp") {
        handleNextSong();
      } else if (code === "ArrowDown") {
        handlePreviousSong();
      } else if (code === "Escape") {
        setWindowOpened(false);
        window.api.closeFullscreen();
      }
    };

    const handleKeyDown = (event) => {
      const target = event.target;
      const tag = target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      handleAction(event.code);
    };

    const removeFs = window.api.onFullscreenKeyDown?.((code) => {
      handleAction(code);
    });

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      removeFs?.();
    };
  }, [windowOpened, currentSongIndex, currentVerseIndex, scheduleSongs]);

  const handleNextSong = async () => {
    setPreviewSong(null);
    if (currentSongIndex < scheduleSongs.length - 1) {
      const next = currentSongIndex + 1;
      setCurrentSongIndex(next);
      setCurrentVerseIndex(0);
      sendCurrent(next, 0);
    }
  };

  const handlePreviousSong = async () => {
    setPreviewSong(null);
    if (currentSongIndex > 0) {
      const prev = currentSongIndex - 1;
      const prevSongData = await window.api.getSong(
        scheduleSongs[prev].song_id
      );
      const lastVerse = prevSongData.verses.length - 1;
      setCurrentSongIndex(prev);
      setCurrentVerseIndex(lastVerse);
      sendCurrent(prev, lastVerse);
    }
  };

  const handleNextVerse = async () => {
    setPreviewSong(null);
    const songData = await window.api.getSong(
      scheduleSongs[currentSongIndex].song_id
    );
    if (currentVerseIndex < songData.verses.length - 1) {
      const next = currentVerseIndex + 1;
      setCurrentVerseIndex(next);
      sendCurrent(currentSongIndex, next);
    } else {
      handleNextSong();
    }
  };

  const handlePrevVerse = async () => {
    setPreviewSong(null);
    if (currentVerseIndex > 0) {
      const prev = currentVerseIndex - 1;
      setCurrentVerseIndex(prev);
      sendCurrent(currentSongIndex, prev);
    } else if (currentSongIndex > 0) {
      const prevSong = currentSongIndex - 1;
      const prevSongData = await window.api.getSong(
        scheduleSongs[prevSong].song_id
      );
      const lastVerse = prevSongData.verses.length - 1;
      setCurrentSongIndex(prevSong);
      setCurrentVerseIndex(lastVerse);
      sendCurrent(prevSong, lastVerse);
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
    if (!windowOpened) return;
    if (currentSongIndex >= scheduleSongs.length) {
      const newIndex = Math.max(scheduleSongs.length - 1, 0);
      setCurrentSongIndex(newIndex);
      setCurrentVerseIndex(0);
      sendCurrent(newIndex, 0);
    } else {
      sendCurrent(currentSongIndex, currentVerseIndex);
    }
  }, [scheduleSongs]);

  useEffect(() => {
    console.log("Selected schedule:", selectedSchedule);
  }, [selectedSchedule]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 flex overflow-hidden">
        {selectedTab === "editor" ? (
          <SongEditor
            songId={editorSongId}
            setSongId={setEditorSongId}
            onBack={() => setSelectedTab(previousTab)}
          />
        ) : (
          <>
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
                <button
                  className={`py-1 px-2 border-l border-t border-r border-gray-300 bg-gray-200 text-sm cursor-pointer ${
                    selectedTab === "editor" ? "bg-white" : ""
                  }`}
                  onClick={() => openEditor(null)}
                >
                  Edytor pieśni
                </button>
                <button onClick={() => setSelectedTab("text")}>Notatki</button>
              </div>
              {selectedTab === "categories" ? (
                <CategoryList setCategory={setCategory} />
              ) : selectedTab === "schedules" ? (
                <ScheduleList setSelectedSchedule={setSelectedSchedule} />
              ) : selectedTab === "text" ? (
                <TextTab />
              ) : null}
            </div>
            <div className="flex-1 border-r border-gray-300 overflow-auto">
              <SongList
                category={category}
                setSelectedSongId={setSelectedSongId}
                selectedSchedule={selectedSchedule}
                onSongAdded={handleSongAdded}
                onPreview={openPreview}
                onEditSong={(id) => openEditor(id)}
              />
            </div>
            <div className="flex-2 flex flex-col">
              <div className="flex-1 bg-black text-white overflow-hidden p-4">
                {previewSong ? (
                  <div className="h-full flex flex-col">
                    <div
                      className="flex-1 overflow-auto"
                      dangerouslySetInnerHTML={{
                        __html: previewSong.verses[
                          previewVerseIndex
                        ].text.replace(/\n/g, "<br />"),
                      }}
                    />
                    <div className="flex justify-center gap-2 mt-2">
                      <button
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-300"
                        onClick={handlePreviewPrev}
                        disabled={previewVerseIndex === 0}
                      >
                        <FaAngleLeft size={30} />
                      </button>
                      <button
                        className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-300"
                        onClick={handlePreviewNext}
                        disabled={
                          previewVerseIndex === previewSong.verses.length - 1
                        }
                      >
                        <FaAngleRight size={30} />
                      </button>
                    </div>
                  </div>
                ) : windowOpened ? (
                  <div
                    className="w-full h-full overflow-auto"
                    dangerouslySetInnerHTML={{
                      __html: currentText.replace(/\n/g, "<br />"),
                    }}
                  />
                ) : (
                  <SongView song={song} />
                )}
              </div>
              <div className="flex-1 flex">
                <Schedule
                  selectedSchedule={selectedSchedule}
                  scheduleSongs={scheduleSongs}
                  setScheduleSongs={setScheduleSongs}
                  currentSongId={scheduleSongs[currentSongIndex]?.song_id}
                  onPreviewSong={openPreview}
                />
              </div>
            </div>
          </>
        )}
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
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
            }}
          >
            <LuPresentation size={30} />
            Prezentuj
          </button>
        )}

        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          onClick={windowOpened ? handlePreviousSong : undefined}
          disabled={
            windowOpened
              ? currentSongIndex === 0 && currentVerseIndex === 0
              : !selectedSongId || verse === 0
          }
          title="Poprzednia pieśń"
        >
          <FaAngleDoubleLeft size={40} />
        </button>
        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          onClick={
            windowOpened ? handlePrevVerse : () => sendContent(verse - 1)
          }
          disabled={
            windowOpened
              ? currentSongIndex === 0 && currentVerseIndex === 0
              : !selectedSongId || verse === 0
          }
          title="Poprzednia zwrotka"
        >
          <FaAngleLeft size={40} />
        </button>
        <button
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          onClick={
            windowOpened ? handleNextVerse : () => sendContent(verse + 1)
          }
          disabled={
            windowOpened
              ? currentSongIndex === scheduleSongs.length - 1 &&
                currentVerseIndex === (currentSong?.verses?.length || 1) - 1
              : !selectedSongId || verse === song?.verses?.length - 1
          }
          title="Następna zwrotka"
        >
          <FaAngleRight size={40} />
        </button>
        <button
          onClick={windowOpened ? handleNextSong : undefined}
          className="rounded py-2 px-3 flex flex-col items-center gap-0.5 font-bold bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer aspect-square justify-center"
          disabled={
            windowOpened
              ? currentSongIndex === scheduleSongs.length - 1
              : !selectedSongId || verse === song?.verses?.length - 1
          }
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

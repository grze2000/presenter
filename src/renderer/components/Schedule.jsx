import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

export const Schedule = ({
  selectedSchedule,
  scheduleSongs,
  setScheduleSongs,
  currentSongId,
  onPreviewSong,
}) => {
  const [songs, setSongs] = useState([]);

  const handleRemove = async (scheduleSongId) => {
    await window.api.removeSongFromSchedule(scheduleSongId);
    setScheduleSongs((prev) => prev.filter((s) => s.id !== scheduleSongId));
  };

  useEffect(() => {
    if (!selectedSchedule) return;
    window.api.getScheduleSongs(selectedSchedule.id).then(setSongs);
  }, [selectedSchedule]);

  const swapSongs = async (indexA, indexB) => {
    const songA = scheduleSongs[indexA];
    const songB = scheduleSongs[indexB];
    if (!songA || !songB) return;

    await window.api.swapSchedulePositions(songA.id, songB.id);

    // lokalnie też zamień miejscami (dla natychmiastowego efektu)
    const updated = [...scheduleSongs];
    [updated[indexA], updated[indexB]] = [updated[indexB], updated[indexA]];
    setScheduleSongs(updated);
  };

  if (!selectedSchedule) {
    return (
      <div className="flex flex-col justify-center items-center flex-1 gap-2">
        <span className="text-gray-400 text-sm">
          Dodaj pieśni aby utworzyć nowy harmonogram lub wybierz istniejący z
          listy harmonogramów
        </span>
      </div>
    );
  }

  if (!scheduleSongs.length) {
    return (
      <div className="flex flex-col justify-center items-center flex-1 gap-2">
        <span className="text-gray-400 text-sm">
          Brak pieśni w harmonogramie. Dodaj pieśni klikając strzałkę przy
          wybranej pieśni
        </span>
      </div>
    );
  }

  return (
    <ul className="w-full">
      {scheduleSongs.map((s, index) => (
        <li key={s.id}>
          <button
            className={`border-b border-gray-300 w-full cursor-pointer hover:bg-gray-100 transition-colors text-left flex items-center pr-2 ${
              s.song_id === currentSongId ? "bg-green-100" : ""
            }`}
            onClick={() => onPreviewSong && onPreviewSong(s.song_id)}
          >
            <span className="border-r border-gray-300 py-1 px-3">
              {index + 1}.
            </span>
            <span className="flex-1 py-1 px-3">{s.title}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  swapSongs(index, index - 1);
                }}
                className={`transition-colors h-6 w-6 flex justify-center items-center rounded ${
                  index === 0
                    ? "text-gray-300"
                    : "hover:bg-green-200 cursor-pointer text-gray-700"
                }`}
              >
                <FaArrowUp size={15} />
              </button>
              <button
                disabled={index === scheduleSongs.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  swapSongs(index, index + 1);
                }}
                className={`transition-colors h-6 w-6 flex justify-center items-center rounded ${
                  index === scheduleSongs.length - 1
                    ? "text-gray-300"
                    : "hover:bg-green-200 cursor-pointer text-gray-700"
                }`}
              >
                <FaArrowDown size={15} />
              </button>
              <button
                className="hover:bg-green-200 transition-colors h-6 w-6 flex justify-center items-center rounded cursor-pointer text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(s.id);
                }}
              >
                <IoClose size={20} />
              </button>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};

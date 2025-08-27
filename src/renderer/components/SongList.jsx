import React, { useEffect, useState } from "react";
import { FaChevronRight, FaPen } from "react-icons/fa";

export const SongList = ({
  category,
  setSelectedSongId,
  selectedSchedule,
  onSongAdded,
  onPreview,
  onEditSong,
}) => {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    if (category) {
      window.api.getSongs(category).then(setSongs);
    }
  }, [category]);

  return (
    <ul>
      {songs.map((s) => (
        <li key={s.id}>
          <div className="border-b border-gray-300 flex">
            <button
              className="flex-1 py-1 px-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                setSelectedSongId(s.id);
                if (onPreview) onPreview(s.id);
              }}
            >
              {s.title}
            </button>
            <button
              className="hover:bg-green-200 transition-colors h-6 w-6 flex justify-center items-center rounded cursor-pointer"
              onClick={async (e) => {
                e.stopPropagation();
                if (!selectedSchedule) return;
                await window.api.addSongToSchedule(selectedSchedule.id, s.id);
                if (onSongAdded) onSongAdded();
              }}
            >
              <FaChevronRight size={14} />
            </button>
            <button
              className="hover:bg-blue-200 transition-colors h-6 w-6 flex justify-center items-center rounded cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditSong) onEditSong(s.id);
              }}
            >
              <FaPen size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

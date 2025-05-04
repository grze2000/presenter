import React, { useEffect, useState } from "react";
import { FaChevronRight } from "react-icons/fa";

export const SongList = ({
  category,
  setSelectedSongId,
  selectedSchedule,
  onSongAdded,
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
          <button
            className="border-b border-gray-300 w-full py-1 px-3 cursor-pointer hover:bg-gray-100 transition-colors text-left flex"
            onClick={() => setSelectedSongId(s.id)}
          >
            <span className="flex-1">{s.title}</span>
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
          </button>
        </li>
      ))}
    </ul>
  );
};

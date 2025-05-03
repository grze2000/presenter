import React, { useEffect, useState } from "react";

export default function SongList({ category, setSelectedSongId }) {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    if (category) {
      window.api.getSongs(category).then(setSongs);
    }
  }, [category]);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Pieśni</h2>
      <ul>
        {songs.map((s) => (
          <li key={s.id}>
            <button onClick={() => setSelectedSongId(s.id)}>{s.title}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

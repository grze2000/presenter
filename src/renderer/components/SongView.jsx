import React from "react";

export const SongView = ({ song }) => {
  if (!song) return <div style={{ padding: "1rem" }}>Wybierz pieśń...</div>;

  return (
    <div className="text-white overflow-auto p-10">
      <h2>{song.title}</h2>
      {song.verses.map((v) => (
        <div key={v.number} style={{ marginBottom: "1em" }}>
          <strong>{v.number}.</strong>
          <p
            dangerouslySetInnerHTML={{
              __html: v.text.replace(/\n/g, "<br />"),
            }}
          />
        </div>
      ))}
    </div>
  );
};

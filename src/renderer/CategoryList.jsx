import React, { useEffect, useState } from "react";

export default function CategoryList({ setCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    window.api.getCategories().then(setCategories);
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Kategorie</h2>
      <ul>
        {categories.map((cat) => (
          <li key={cat.code}>
            <button onClick={() => setCategory(cat.code)}>{cat.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

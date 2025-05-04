import React, { useEffect, useState } from "react";

export const CategoryList = ({ setCategory }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    window.api.getCategories().then(setCategories);
  }, []);

  return (
    <ul>
      {categories.map((cat) => (
        <li key={cat.code}>
          <button
            className="border-b border-gray-300 w-full py-1 px-3 cursor-pointer hover:bg-gray-100 transition-colors text-left"
            onClick={() => setCategory(cat.code)}
          >
            {cat.name}
          </button>
        </li>
      ))}
    </ul>
  );
};

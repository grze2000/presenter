import React, { useEffect, useState } from "react";

export const ScheduleList = ({ setSelectedSchedule }) => {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    window.api.getSchedules().then(setSchedules);
  }, []);

  return (
    <ul>
      {schedules.map((schedule) => (
        <li key={schedule.id}>
          <button
            className="border-b border-gray-300 w-full py-1 px-3 cursor-pointer hover:bg-gray-100 transition-colors text-left"
            onClick={() => setSelectedSchedule(schedule)}
          >
            {schedule.name}
          </button>
        </li>
      ))}
    </ul>
  );
};

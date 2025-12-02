import React, { useEffect, useState } from "react";

export const ScheduleList = ({ setSelectedSchedule, selectedSchedule }) => {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const load = async () => {
      const list = await window.api.getSchedules();
      if (!list.length) {
        const created = await window.api.createSchedule();
        const refreshed = await window.api.getSchedules();
        setSchedules(refreshed);
        setSelectedSchedule(created);
        return;
      }

      setSchedules(list);
      if (!selectedSchedule) {
        setSelectedSchedule(list[0]);
      }
    };

    load();
  }, [selectedSchedule, setSelectedSchedule]);

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

// src/components/DriveList.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

const DriveList = ({ onSelectDrive }) => {
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/drives")
      .then(response => setDrives(response.data.drives))
      .catch(error => console.error("Error fetching drives:", error));
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-md">
      <h2 className="text-lg font-bold mb-2">Available Drives</h2>
      <ul>
        {drives.map((drive, index) => (
          <li key={index} className="p-2 cursor-pointer hover:bg-gray-700"
              onClick={() => onSelectDrive && onSelectDrive(drive)}>
            {drive}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DriveList;

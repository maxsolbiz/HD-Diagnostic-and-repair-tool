// src/components/DriveDetails.jsx

import React, { useEffect, useState } from "react";
import { getSmartData } from "../api/api";

const DriveDetails = ({ selectedDrive }) => {
  const [smartData, setSmartData] = useState({});

  useEffect(() => {
    if (!selectedDrive) return;

    getSmartData(selectedDrive)
      .then((response) => {
        if (response && response.smart_data) {
          setSmartData(response.smart_data);
        }
      })
      .catch((error) => console.error("❌ SMART Data Error:", error));
  }, [selectedDrive]);

  return (
    <div className="bg-gray-800 p-4 rounded-md text-white">
      <h3 className="text-lg font-bold mb-2">📊 SMART Data for {selectedDrive}</h3>
      <table className="table-auto w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1">Attribute</th>
            <th className="px-2 py-1">Value</th>
            <th className="px-2 py-1">Worst</th>
            <th className="px-2 py-1">Threshold</th>
            <th className="px-2 py-1">Raw</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(smartData).map(([key, attr], index) => (
            <tr key={index}>
              <td className="px-2 py-1">{key}</td>
              <td className="px-2 py-1">{attr.value}</td>
              <td className="px-2 py-1">{attr.worst}</td>
              <td className="px-2 py-1">{attr.threshold}</td>
              <td className="px-2 py-1">{attr.raw_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DriveDetails;

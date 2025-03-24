import React, { useState } from "react";

const Benchmark = () => {
    const [progress, setProgress] = useState(0);
    const [running, setRunning] = useState(false);

    const runBenchmark = () => {
        setRunning(true);
        let p = 0;
        const interval = setInterval(() => {
            p += 10;
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setRunning(false);
            }
        }, 500);
    };

    return (
        <div className="p-4 bg-gray-900 text-white rounded-md">
            <h2 className="text-xl mb-2">🧪 Disk Benchmark</h2>
            <button
                className="bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600"
                onClick={runBenchmark}
                disabled={running}
            >
                🚀 Run Benchmark
            </button>
            <div className="mt-4">
                <div className="bg-gray-800 h-4 rounded-md overflow-hidden">
                    <div
                        className="bg-green-500 h-4 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="mt-2 text-sm">{progress}% Complete</p>
            </div>
        </div>
    );
};

export default Benchmark;

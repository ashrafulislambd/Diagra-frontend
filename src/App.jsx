import React, { lazy, useEffect, useRef, useState } from "react";
import { Graphviz } from "graphviz-react";

export default () => {
  const [diagram, setDiagram] = useState("digraph {}");
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [histories, setHistories] = useState([]);
  const [prompt, setPrompt] = useState("");

  const svgRef = useRef();

  useEffect(() => {
    if(localStorage.history) {
        setHasHistory(true);
        setHistories(JSON.parse(localStorage.history));
    }
  }, [loaded]);

  return <div className="flex flex-1 overflow-hidden mx-5 flex-col-reverse sm:flex-row min-h-[calc(100vh-400px)]">
        {/* Sidebar for History */}h
        <div className="w-full md:w-1/4 custom-bg h-auto max-h-screen p-4 border border-white m-4 mb-4 rounded-lg flex flex-col justify-between">
            <div>
                <h2 className="font-sans text-white text-3xl mb-8 mt-5">History</h2>
                <div className="space-y-5 text-xl text-white overflow-y-auto max-h-[calc(100vh-240px)]">
                    {
                        !hasHistory && 
                        <div className="flex items-center p-2 rounded-lg">
                            No items to show
                        </div>
                    }
                    {
                        histories.map(history => (
                            <div key={`key-${history.prompt}`} onClick={() => {
                                setPrompt(history.prompt);
                                setDiagram(history.diagram);
                                setLoaded(true);
                                setIsLoading(false); 
                            }} className="flex items-center p-2 rounded-lg hover:font-semibold hover:cursor-pointer">
                                <i className="fa-solid fa-paperclip text-gray-400 mr-2"></i>
                                { history.prompt.slice(0, 40) }
                            </div>
                        ))
                    }
                </div>
            </div>
            <button className="ml-12 mr-12 bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 mt-4">Clear History</button>
        </div>
        
        {/* output area */}
        <div className="flex-1 flex flex-col">
            <div className="flex-1 mb-4 md:mb-4 border rounded-lg ml-4 mr-4 border-white box-border p-4">
                { prompt != "" &&
                    <div className="flex my-2 justify-end">
                        <div className="rounded bg-sky-300 p-2 font-sans shadow-md shadow-white">
                            Generate a diagram on "{prompt}"
                        </div>
                    </div>
                }
                { loaded && 
                    <div className="flex my-2">
                        <div className="rounded bg-sky-300 p-2 font-sans shadow-md shadow-white">
                            Sure, here's a diagram on "{prompt}"
                        </div>
                    </div>
                }
                { loaded && 
                    <div className="flex my-2">
                        <div ref={svgRef} className="rounded bg-sky-300 p-2 font-sans shadow-md shadow-white">
                            <div className="flex items-center bg-blue-500 text-white text-sm font-bold px-4 py-3" role="alert">
                                <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M12.432 0c1.34 0 2.01.912 2.01 1.957 0 1.305-1.164 2.512-2.679 2.512-1.269 0-2.009-.75-1.974-1.99C9.789 1.436 10.67 0 12.432 0zM8.309 20c-1.058 0-1.833-.652-1.093-3.524l1.214-5.092c.211-.814.246-1.141 0-1.141-.317 0-1.689.562-2.502 1.117l-.528-.88c2.572-2.186 5.531-3.467 6.801-3.467 1.057 0 1.233 1.273.705 3.23l-1.391 5.352c-.246.945-.141 1.271.106 1.271.317 0 1.357-.392 2.379-1.207l.6.814C12.098 19.02 9.365 20 8.309 20z"/></svg>
                                <p>Use your mouse wheel to zoom in/out. Drag and drop to move the diagram</p>
                            </div>
                            <Graphviz className="hover:cursor-grab" dot={diagram} options={{
                                zoom: true,
                            }} />
                            <button className="bg-blue-800 text-white rounded-lg p-2 mt-2" 
                                onClick={() => {
                                const graph = svgRef.current.querySelector("svg");
                                const svgData = new XMLSerializer().serializeToString(graph);
                                const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8"});
                                const url = URL.createObjectURL(blob);

                                const anchor = document.createElement("a");
                                anchor.href = url;
                                anchor.download = "graph.svg";
                                anchor.click();
                            }}>Download</button>
                        </div>
                    </div>
                }
                { isLoading &&
                    <div className="flex my-2">
                        <div className="rounded bg-sky-300 p-2 font-sans shadow-md shadow-white">
                            <div class='flex space-x-2 justify-center items-center bg-white h-[100px] dark:invert'>
                                <span class='sr-only'>Loading...</span>
                                <div class='h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]'></div>
                                <div class='h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]'></div>
                                <div class='h-8 w-8 bg-black rounded-full animate-bounce'></div>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <div className="flex items-center bg-gray-300 p-3 rounded-t-lg shadow-md w-full">
                <input type="text" onChange={e => {
                    setPrompt(e.target.value);
                    setLoaded(false);
                }} className="flex-1 p-3 bg-gray-300 border rounded-lg" placeholder="Enter prompt..." />
                <button onClick={() => {
                  setLoaded(false);
                  setIsLoading(true);
                  fetch(`http://localhost:8000/diagram/?topic=${prompt}`)
                    .then(res => res.json())
                    .then(res => {
                      setDiagram(res.output);
                      if(!localStorage.history) {
                        localStorage.history = "[]";
                      }
                      localStorage.history = JSON.stringify([
                        {
                            "prompt": prompt,
                            "diagram": res.output,
                        },
                        ...JSON.parse(localStorage.history),
                      ]);
                      setLoaded(true);
                      setIsLoading(false);
                    })
                }} className="bg-purple-800 text-white text-2xl ml-2 font-mono px-6 py-2 rounded-lg hover:bg-purple-700">Send</button>
            </div>
        </div>
    </div>
};

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import gridImage from "../assets/grid.svg"; // Adjust the path as necessary

function OllamaOutput() {
  // Use an array to store blocks of messages
  const [messages, setMessages] = useState([""]);
  const [inputValue, setInputValue] = useState("");
  const [countdown, setCountdown] = useState(null); // State to manage the countdown display
  const [isActive, setIsActive] = useState(false); // State to manage if the countdown is active
  const [isCountdownDisplayed, setIsCountdownDisplayed] = useState(false); // State to manage if the countdown is active
  const scrollableContentRef = useRef(null);

  useEffect(() => {
    let intervalId;

    if (isActive && countdown !== null) {
      intervalId = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown - 1 <= 0) {
            closeWindow();
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }

    // Cleanup
    return () => clearInterval(intervalId);
  }, [isActive, countdown]);

  const handleMouseEnter = () => {
    setIsActive(false); // Pause the countdown
  };

  const handleMouseLeave = () => {
    if (countdown !== null && isCountdownDisplayed) {
      setIsActive(true); // Resume the countdown
    }
  };

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const closeWindow = () => {
    // Start a new message block upon receiving an "end" signal
    window.api.send("close-output-window", inputValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    if (inputValue.trim() !== "") {
      setIsCountdownDisplayed(false);
      setIsActive(false);
      window.api.send("user-input", inputValue);
      setInputValue(""); // Clear the input after sending
    }
  };

  useEffect(() => {
    if (scrollableContentRef.current) {
      scrollableContentRef.current.scrollTop =
        scrollableContentRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const messageListener = (data) => {
      // Append data to the latest message block
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] += data;
        return updatedMessages;
      });
    };

    const messageEnd = () => {
      // Start a new message block upon receiving an "end" signal
      setMessages((prevMessages) => [...prevMessages, ""]);
      setCountdown(15);
      setIsActive(true);
      setIsCountdownDisplayed(true);
    };

    window.api.receive("ollama-output", messageListener);
    window.api.receive("ollama-output-end", messageEnd);

    // Cleanup the effect
    return () => {
      window.api.removeListener("ollama-output", messageListener);
      window.api.removeListener("ollama-output-end", messageEnd);
    };
  }, []);

  return (
    <div id="ollamaOutput" className="flex flex-col h-screen m-2">
      {/* Sticky Header */}
      <div className="bg-red flex justify-between items-center p-4 fixed top-0 left-0 right-0 m-2 z-10">
        {isCountdownDisplayed ? (
          <div>
            closing in {countdown}{" "}
            <button
              onClick={() => {
                setIsActive(false);
                setIsCountdownDisplayed(false);
              }}
              className="underline hover:text-red-500 cursor-pointer"
            >
              undo
            </button>
          </div>
        ) : (
          <img className="w-3 h-3" src={gridImage} alt="Grid" />
        )}
        <button
          className="underline hover:text-red-500 cursor-pointer"
          onClick={closeWindow}
        >
          close
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={scrollableContentRef}
        className="flex-1 overflow-y-auto py-2 space-y-4 mt-16 mb-16"
      >
        {messages.map(
          (message, index) =>
            message.trim() !== "" && (
              <div key={index} className="rounded-xl p-4 text-white text-left">
                <ReactMarkdown>{message || ""}</ReactMarkdown>
              </div>
            )
        )}
      </div>

      {/* Sticky Footer */}
      <form
        className="fixed bottom-0 left-0 right-0 py-2 px-4 m-2 bg-black/70 rounded-xl"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="w-full h-full focus:outline-none bg-transparent text-white"
          value={inputValue}
          onChange={handleChange}
          placeholder="How can I help you?"
        />
        <button type="submit" className="hidden">
          Submit
        </button>
      </form>
    </div>
  );
}

export default OllamaOutput;

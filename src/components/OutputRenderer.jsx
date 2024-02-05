import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import gridIconAnimated from "../assets/grid.svg"; // Adjust the path as necessary
import gridIconFixed from "../assets/grid.png"; // Adjust the path as necessary
import { CopyBlock, irBlack } from "react-code-blocks";
import hljs from "highlight.js";

function OllamaOutput() {
  // Use an array to store blocks of messages
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const scrollableContentRef = useRef(null);
  const [icon, setIcon] = useState(gridIconFixed);

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const parseMessage = (text) => {
    const segments = [];
    const regex = /```(.*?)```/gs;

    let lastIndex = 0;
    text.replace(regex, (match, code, index) => {
      // Push preceding non-code text if it exists
      if (index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, index), isCode: false });
      }
      // Detect language and push code block
      const detectedLanguage = hljs.highlightAuto(code).language;
      segments.push({
        text: code,
        isCode: true,
        language: detectedLanguage || "plaintext",
      });
      lastIndex = index + match.length;
    });

    // Push remaining non-code text if it exists
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isCode: false });
    }

    return segments;
  };

  const closeWindow = () => {
    // Start a new message block upon receiving an "end" signal
    window.api.send("close-output-window", inputValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    window.api.send("user-input", inputValue);
    setIcon(gridIconAnimated);
    setInputValue(""); // Clear the input after sending
  };

  useEffect(() => {
    if (scrollableContentRef.current) {
      scrollableContentRef.current.scrollTop =
        scrollableContentRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const messageListener = (data) => {
      setMessages((prevMessages) => {
        // Check if the last message is of type "output" to continue appending to it
        if (
          prevMessages.length > 0 &&
          prevMessages[prevMessages.length - 1].type === "output"
        ) {
          // Create a new array to avoid direct state mutation
          const updatedMessages = [...prevMessages];
          // Append the new data to the last message's text
          updatedMessages[updatedMessages.length - 1] = {
            ...updatedMessages[updatedMessages.length - 1],
            text: updatedMessages[updatedMessages.length - 1].text + data,
          };
          return updatedMessages;
        } else {
          // If the last message is not of type "output", add a new message
          return [...prevMessages, { text: data, type: "output" }];
        }
      });
    };

    const messageEnd = () => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "", type: "output" }, // Adjust according to your actual structure
      ]);
      setIcon(gridIconFixed);
    };

    const inputListener = (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data, type: "input" }, // Specify message type as "input"
      ]);
    };

    window.api.receive("ollama-output", messageListener);
    window.api.receive("ollama-output-end", messageEnd);
    window.api.receive("ollama-input", inputListener);

    // Cleanup the effect
    return () => {
      window.api.removeListener("ollama-output", messageListener);
      window.api.removeListener("ollama-output-end", messageEnd);
      window.api.removeListener("ollama-input", inputListener);
    };
  }, []);

  return (
    <div id="ollamaOutput" className="flex flex-col h-screen m-2">
      {/* Sticky Header */}
      <div
        id="header"
        className="bg-red flex justify-between items-center p-4 fixed top-0 left-0 right-0 m-2 z-10"
      >
        {/* <img className="w-3 h-3" src={icon} alt="Grid" />
        <button
          className="underline hover:text-red-500 cursor-pointer"
          onClick={closeWindow}
        >
          close
        </button> */}
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={scrollableContentRef}
        className="flex-1 overflow-y-auto py-2 space-y-4 mt-16 mb-16"
      >
        {messages.map(
          (message, index) =>
            message.text.trim() !== "" && (
              <div
                key={index}
                className={`rounded-xl p-1 text-left ${
                  message.type === "input" ? "text-red-400" : "white"
                }`}
              >
                {parseMessage(message.text).map((segment, segmentIndex) =>
                  segment.isCode ? (
                    <span className="py-8">
                      <CopyBlock
                        language={segment.language}
                        key={segmentIndex}
                        text={segment.text}
                        theme={irBlack}
                      />
                    </span>
                  ) : (
                    <ReactMarkdown key={segmentIndex}>
                      {segment.text}
                    </ReactMarkdown>
                  )
                )}
              </div>
            )
        )}
      </div>

      {/* Sticky Footer */}
      <form
        className="fixed bottom-0 left-0 justify-content items-center gap-4 flex right-0 py-2 px-4 m-2 bg-black/70 rounded-xl"
        onSubmit={handleSubmit}
      >
        <img className="w-3 h-3" src={icon} alt="Grid" />
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

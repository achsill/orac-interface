import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import gridIconAnimated from "../assets/grid.svg"; // Adjust the path as necessary
import gridIconFixed from "../assets/grid.png"; // Adjust the path as necessary
import { CopyBlock, irBlack } from "react-code-blocks";
import UserInput from "./UserInput";
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
    <div id="ollamaOutput" className="flex flex-col h-screen">
      <div
        ref={scrollableContentRef}
        className="flex-1 overflow-y-auto space-y-4 mt-8 p-6"
      >
        {messages.map(
          (message, index) =>
            message.text.trim() !== "" && (
              <div
                key={index}
                className={`rounded-xl p-1 text-left ${
                  message.type === "input" ? "text-indigo-500" : "white"
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
      <div className="flex-[0.25] flex items-start w-full border-t border-dashed border-indigo-500 pt-3">
        <UserInput isOriginExtanded={true} />
      </div>
    </div>
  );
}

export default OllamaOutput;

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

  const openSettingsWindow = () => {
    window.api.send("settings-button-clicked");
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

    const displayError = (data) => {
      console.log(data);
      setMessages((prevMessages) => {
        return [...prevMessages, { text: data, type: "output" }];
      });
    };

    window.api.receive("ollama-error", displayError);
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
      <div className="flex w-full">
        <div id="head" className="w-3/4 h-8">
          {" "}
        </div>
        <button
          onClick={openSettingsWindow}
          id="buttonSettings"
          className="text-xs underline fixed right-4 top-4 cursor-pointer hover:text-neutral-500"
        >
          Settings
        </button>
      </div>
      <div
        ref={scrollableContentRef}
        className="flex-1 overflow-y-auto space-y-4 p-6"
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

      <div className="flex-[0.25] flex items-start  m-4 rounded pt-3">
        <UserInput isOriginExtanded={true} />
      </div>
    </div>
  );
}

export default OllamaOutput;

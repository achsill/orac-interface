import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import gridIconFixed from "../assets/grid.png"; // Adjust the path as necessary
import { CopyBlock, irBlack } from "react-code-blocks";
import UserInput from "./UserInput";
import hljs from "highlight.js";

interface Segment {
  text: string;
  isCode: boolean;
  language: string;
}

function OutputRenderer() {
  // Use an array to store blocks of messages
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const scrollableContentRef = useRef(null);
  const [icon, setIcon] = useState(gridIconFixed);

  const parseMessage = (text: string) => {
    const segments = [];
    const regex = /```(.*?)```/gs;

    let lastIndex = 0;
    text.replace(regex, (match: string, ...args: any[]): string => {
      if (args[1] > lastIndex) {
        segments.push({ text: text.slice(lastIndex, args[1]), isCode: false });
      }
      const detectedLanguage = hljs.highlightAuto(args[0]).language;
      segments.push({
        text: args[0],
        isCode: true,
        language: detectedLanguage || "plaintext",
      });
      lastIndex = args[1] + match.length;
      return "hehe";
    });

    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), isCode: false });
    }

    return segments;
  };

  const openSettingsWindow = () => {
    window.api.send("settings-button-clicked");
  };

  const closeWindow = () => {
    window.api.send("close-output-window", inputValue);
  };

  useEffect(() => {
    if (scrollableContentRef.current) {
      scrollableContentRef.current.scrollTop =
        scrollableContentRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const messageListener = (data: string) => {
      setMessages((prevMessages) => {
        if (
          prevMessages.length > 0 &&
          prevMessages[prevMessages.length - 1].type === "output"
        ) {
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = {
            ...updatedMessages[updatedMessages.length - 1],
            text: updatedMessages[updatedMessages.length - 1].text + data,
          };
          return updatedMessages;
        } else {
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

    const inputListener = (data: string) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data, type: "input" }, // Specify message type as "input"
      ]);
    };

    const displayError = (data: string) => {
      setMessages((prevMessages) => {
        return [...prevMessages, { text: data, type: "output" }];
      });
    };

    window.api.receive("ia-error", displayError);
    window.api.receive("ia-output", messageListener);
    window.api.receive("ia-output-end", messageEnd);
    window.api.receive("ia-input", inputListener);

    return () => {
      window.api.removeListener("ia-output", messageListener);
      window.api.removeListener("ia-output-end", messageEnd);
      window.api.removeListener("ia-input", inputListener);
    };
  }, []);

  return (
    <div id="ollamaOutput" className="flex flex-col h-screen">
      <div className="flex w-full h-8 fixed px-4 py-6 bg-stone-950/95 justify-center items-center">
        <button
          onClick={closeWindow}
          id="buttonSettings"
          className="text-xs underline cursor-pointer hover:text-neutral-500"
        >
          Close
        </button>
        <div id="head" className="h-6 w-full"></div>
        <button
          onClick={openSettingsWindow}
          id="buttonSettings"
          className="text-xs underline cursor-pointer hover:text-neutral-500"
        >
          Settings
        </button>
      </div>
      <div
        ref={scrollableContentRef}
        className="flex-1 overflow-y-auto space-y-4 px-4 py-8 mt-4"
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
                {parseMessage(message.text).map(
                  (segment: Segment, segmentIndex) =>
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

export default OutputRenderer;

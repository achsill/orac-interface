import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function OllamaOutput() {
  // Use an array to store blocks of messages
  const [messages, setMessages] = useState([""]);
  const [inputValue, setInputValue] = useState("");

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    if (inputValue.trim() !== "") {
      window.api.send("user-input", inputValue);
      setInputValue(""); // Clear the input after sending
    }
  };

  useEffect(() => {
    const messageListener = (data) => {
      console.log(data); // Log the incoming data
      // Append data to the latest message block
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] += data;
        return updatedMessages;
      });
    };

    const messageEnd = () => {
      console.log("End of message block.");
      // Start a new message block upon receiving an "end" signal
      setMessages((prevMessages) => [...prevMessages, ""]);
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
    <div id="ollamaOutput" className="overflow-auto py-2 space-y-4 h-[75vh]">
      <div className=" h-12 bg-red flex w-screen justify-between items-start p-4">
        <div>
          closing in {10}{" "}
          <button className="underline hover:text-red-500">undo</button>
        </div>
        <button className="underline hover:text-red-500">close</button>
      </div>
      {messages.map(
        (message, index) =>
          message.trim() !== "" && ( // Check if the message is not an empty string
            <div
              key={index}
              className="rounded-xl p-4 text-white text-left" // Styling for each message block
            >
              <ReactMarkdown>{message || ""}</ReactMarkdown>
            </div>
          )
      )}
      <form onSubmit={handleSubmit}>
        <input
          className="h-12 w-screen px-2 bg-transparent fixed border-t border-neutral-700 focus:border-neutral-400 focus:outline-none bottom-0 left-0"
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder="ask me a question"
        />
        <button type="submit" className="hidden">
          Submit
        </button>
      </form>
    </div>
  );
}

export default OllamaOutput;

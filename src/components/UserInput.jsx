import React, { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary
import grid from "../assets/grid.svg"; // Adjust the path as necessary

function UserInput() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null); // Create a ref for the input element

  useEffect(() => {
    // Automatically focus the input element when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  return (
    <form
      className="flex  w-screen h-screen bg-black/80 justify-center items-center"
      onSubmit={handleSubmit}
    >
      <img src={grid} className="2-6 h-3 px-4" alt="Logo" />{" "}
      <input
        ref={inputRef} // Attach the ref to the input element
        className="text-white focus:outline-none font-bold py-2 pr-4 rounded flex-1 bg-transparent"
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="How can I help you?"
      />
      <button type="submit" className="hidden">
        Submit
      </button>
    </form>
  );
}

export default UserInput;

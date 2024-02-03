import React, { useState } from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary

function UserInput() {
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

  return (
    <form
      className="flex  w-screen h-screen bg-black/80 justify-center items-center"
      onSubmit={handleSubmit}
    >
      <img src={logo} className="2-6 h-6 px-4" alt="Logo" />{" "}
      <input
        className="text-white focus:outline-none font-bold py-2 pr-4 rounded flex-1 bg-transparent"
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="ask me a question"
      />
      <button type="submit" className="hidden">
        Submit
      </button>
    </form>
  );
}

export default UserInput;

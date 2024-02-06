import React, { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png"; // Adjust the path as necessary
import grid from "../assets/grid.svg"; // Adjust the path as necessary

function UserInput() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null); // Create a ref for the input element
  const formRef = useRef(null); // Create a ref for the form element

  useEffect(() => {
    // Automatically focus the input element when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        window.api.send("close-input-window", inputValue);
      }
      if (event.shiftKey && event.key === "Enter") {
        console.log("hehe");
        event.preventDefault(); // Prevent the default action (Enter = submit in form)
        window.api.send("extend-input-window"); // Call your function
      }
    };

    // Add event listener for the Escape key
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        window.api.send("close-input-window", inputValue);
      }
    };

    // Add event listener for clicks outside the form
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleBlur = () => {
    // Trigger when the input loses focus
    window.api.send("close-input-window", inputValue);
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
      ref={formRef} // Attach the ref to the form element
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

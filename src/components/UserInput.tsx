import React, {
  useState,
  useRef,
  useEffect,
  TextareaHTMLAttributes,
} from "react";
import grid from "../assets/grid.svg"; // Adjust the path as necessary

interface InputParams {
  isOriginExtanded?: boolean;
}

function UserInput({ isOriginExtanded }: InputParams) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null); // Create a ref for the input element
  const formRef = useRef(null); // Create a ref for the form element
  const [isinputExpanded, setIsInputExpanded] = useState(isOriginExtanded);

  useEffect(() => {
    // Automatically focus the input element when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        window.api.send("minimize-search-window", inputValue);
      }
      if (event.shiftKey && event.key === "Enter") {
        setIsInputExpanded(true);
        event.preventDefault(); // Prevent the default action (Enter = submit in form)
        window.api.send("extend-input-window"); // Call your function
      }
    };

    // Add event listener for the Escape key
    const handleClickOutside = (event: any) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        window.api.send("minimize-search-window", inputValue);
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

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    // Get pasted text  || window.clipboardData to add below
    const paste = event.clipboardData.getData("text");
    setInputValue(paste);
    // Check if the pasted text contains newline characters
    if (paste.includes("\n")) {
      setIsInputExpanded(true);
      window.api.send("extend-input-window"); // Call your function    }
    }
  };

  const handleTextAreaKeyDown = (event: any) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent the default Enter action (new line)
      handleSubmit(event); // Call the submit form function
    } else if (event.key === "Enter" && event.shiftKey) {
      setInputValue(inputValue + "\n");
    }
    // Shift + Enter is allowed by default, so no need for additional handling
  };

  const handleSubmit = (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    if (inputValue.trim() !== "") {
      window.api.send("user-input", inputValue);
      setInputValue(""); // Clear the input after sending
    }
  };

  return (
    <form
      ref={formRef}
      className="flex h-full w-full  justify-center items-start"
      onSubmit={handleSubmit}
    >
      {isinputExpanded ? (
        <div className="flex h-full w-full items-start">
          <div className="h-full flex align-start px-4">
            <img src={grid} className="mt-[0.42rem] h-3" alt="Logo" />{" "}
          </div>
          <textarea
            value={inputValue}
            placeholder="How can I help you?"
            onChange={handleChange}
            onKeyDown={handleTextAreaKeyDown}
            className="text-white resize-none w-full focus:outline-none h-full font-bold bg-transparent"
          ></textarea>
          <div className=" w-full justify-end gap-4 px-6 py-3 items-end text-white hidden">
            <button type="submit">send</button>
          </div>
        </div>
      ) : (
        <div className="flex justify-start items-center w-full h-full gap-4 mx-4">
          <img src={grid} className=" h-3 " alt="Logo" />{" "}
          <input
            ref={inputRef}
            className="text-white focus:outline-none font-bold flex-1 bg-transparent"
            type="text"
            value={inputValue}
            onChange={handleChange}
            onPaste={handlePaste} // Add this line
            placeholder="How can I help you?"
          />
          <button type="submit" className="hidden">
            Submit
          </button>
        </div>
      )}
    </form>
  );
}

export default UserInput;

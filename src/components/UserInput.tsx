import React, {
  useState,
  useRef,
  useEffect,
  TextareaHTMLAttributes,
} from "react";
import grid from "../assets/grid.svg";

interface InputParams {
  isOriginExtanded?: boolean;
}

function UserInput({ isOriginExtanded }: InputParams) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const [isinputExpanded, setIsInputExpanded] = useState(isOriginExtanded);

  const expandWindow = () => {
    setIsInputExpanded(true);
    window.api.send("extend-input-window");
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        window.api.send("minimize-search-window", inputValue);
      }
      if (event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        expandWindow();
      }
    };

    const handleClickOutside = (event: any) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        window.api.send("minimize-search-window", inputValue);
      }
    };

    const handleClipboardPaste = (data: string) => {
      setInputValue(data + "\n");
      expandWindow();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.api.receive("send-clipboard-content", handleClipboardPaste);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.api.removeListener("send-clipboard-content", handleClipboardPaste);
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
    const paste = event.clipboardData.getData("text");
    setInputValue(paste);
    if (paste.includes("\n")) {
      expandWindow();
    }
  };

  const handleTextAreaKeyDown = (event: any) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    } else if (event.key === "Enter" && event.shiftKey) {
      setInputValue(inputValue + "\n");
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      window.api.send("user-input", inputValue);
      setInputValue("");
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
            <img src={grid} className="mt-[0.42rem] h-3" alt="Logo" />
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
          <img src={grid} className=" h-3 " alt="Logo" />
          <input
            ref={inputRef}
            className="text-white focus:outline-none font-bold flex-1 bg-transparent"
            type="text"
            value={inputValue}
            onChange={handleChange}
            onPaste={handlePaste}
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

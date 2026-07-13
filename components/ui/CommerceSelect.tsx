"use client";

import {
  ChevronDown,
  Check,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface CommerceSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CommerceSelectProps {
  label?: string;

  value: string;

  options: CommerceSelectOption[];

  onChange: (value: string) => void;

  placeholder?: string;

  searchable?: boolean;

  className?: string;
}

export default function CommerceSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  searchable = true,
  className = "",
}: CommerceSelectProps) {

  const containerRef =
    useRef<HTMLDivElement>(null);

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const selectedOption =
    options.find(
      (option) => option.value === value
    );

  const filteredOptions = useMemo(() => {

    if (!searchable) return options;

    if (!search.trim()) return options;

    return options.filter((option) =>
      option.label
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [
    search,
    options,
    searchable,
  ]);

  useEffect(() => {

    const handleClickOutside = (
      event: MouseEvent
    ) => {

      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {

        setOpen(false);

      }

    };

    const handleEscape = (
      event: KeyboardEvent
    ) => {

      if (event.key === "Escape") {

        setOpen(false);

      }

    };

    window.addEventListener(
      "mousedown",
      handleClickOutside
    );

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {

      window.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, []);

  useEffect(() => {

    if (
      open &&
      searchable
    ) {

      setTimeout(() => {

        searchInputRef.current?.focus();

      }, 100);

    }

  }, [
    open,
    searchable,
  ]);
    return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Label */}

        {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
            {label}
        </label>
        )}

      {/* Trigger */}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          flex
          h-11
          w-full
          items-center
          justify-between
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          text-left
          transition-all
          duration-200
          hover:border-slate-400
          hover:bg-slate-50
          ${open ? "border-blue-500 ring-4 ring-blue-100" : ""}
        `}
      >
        <div className="flex items-center gap-3">

          {selectedOption?.icon && (
            <span className="flex h-5 w-5 items-center justify-center">
              {selectedOption.icon}
            </span>
          )}

          <span
            className={`text-sm ${
              selectedOption
                ? "font-medium text-slate-900"
                : "text-slate-400"
            }`}
          >
            {selectedOption?.label ?? placeholder}
          </span>

        </div>

        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            z-50
            mt-2
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-xl
          "
        >
          {searchable && (
            <div className="border-b border-slate-100 p-3">

              <div className="relative">

                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    pl-10
                    pr-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:bg-white
                  "
                />

              </div>

            </div>
          )}

          <div className="max-h-72 overflow-y-auto">

                        {filteredOptions.length === 0 ? (
              <div className="px-4 py-10 text-center">

                <p className="text-sm font-medium text-slate-600">
                  No results found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try another search.
                </p>

              </div>
            ) : (
              filteredOptions.map((option) => {

                const selected =
                  option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      px-4
                      py-3
                      text-left
                      transition
                      hover:bg-slate-50
                      ${
                        selected
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-700"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">

                      {option.icon && (
                        <span className="flex h-5 w-5 items-center justify-center">
                          {option.icon}
                        </span>
                      )}

                      <span className="text-sm font-medium">
                        {option.label}
                      </span>

                    </div>

                    {selected && (
                      <Check
                        size={16}
                        className="text-blue-600"
                      />
                    )}

                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
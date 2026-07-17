"use client";

import {
  Check,
  ChevronDown,
  Search,
} from "lucide-react";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

export interface CommerceSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
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

  const triggerRef =
    useRef<HTMLButtonElement>(null);

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [mounted, setMounted] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [style, setStyle] =
    useState<CSSProperties>({});

  const selected = options.find(
    (o) => o.value === value
  );

  const filtered = useMemo(() => {

    if (!searchable) return options;

    if (!search.trim()) return options;

    return options.filter((o) =>
      o.label
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [
    search,
    searchable,
    options,
  ]);

  useEffect(() => {

    setMounted(true);

  }, []);

  useLayoutEffect(() => {

    if (!open) return;

    const trigger =
      triggerRef.current;

    if (!trigger) return;

    const rect =
      trigger.getBoundingClientRect();

    setStyle({

      position: "fixed",

      top: rect.bottom + 8,

      left: rect.left,

      width: rect.width,

      zIndex: 9999,

    });

  }, [open]);

  useEffect(() => {

    if (!open) return;

    const handleClick = (
      e: MouseEvent
    ) => {

      if (
        triggerRef.current?.contains(
          e.target as Node
        )
      ) {

        return;

      }

      setOpen(false);

    };

    const handleEscape = (
      e: KeyboardEvent
    ) => {

      if (e.key === "Escape") {

        setOpen(false);

      }

    };

    window.addEventListener(
      "click",
      handleClick
    );

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {

      window.removeEventListener(
        "click",
        handleClick
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [open]);
    useEffect(() => {

    if (
      open &&
      searchable
    ) {

      requestAnimationFrame(() => {

        searchInputRef.current?.focus();

      });

    }

  }, [
    open,
    searchable,
  ]);

  return (

    <>

      <div className={className}>

        {label && (

          <label className="mb-2 block text-sm font-medium text-slate-700">

            {label}

          </label>

        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`
            flex
            h-12
            w-full
            items-center
            justify-between
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            transition-all
            duration-200
            hover:border-slate-300
            hover:bg-slate-50
            ${
              open
                ? "border-blue-500 ring-4 ring-blue-100"
                : ""
            }
          `}
        >

          <div className="flex items-center gap-3">

            {selected?.icon && (

              <span>

                {selected.icon}

              </span>

            )}

            <span
              className={
                selected
                  ? "text-sm font-medium text-slate-900"
                  : "text-sm text-slate-400"
              }
            >

              {selected?.label ?? placeholder}

            </span>

          </div>

          <ChevronDown
            size={18}
            className={`transition duration-200 ${
              open
                ? "rotate-180"
                : ""
            }`}
          />

        </button>

      </div>

      {mounted &&
        open &&
        createPortal(

          <div
            style={style}
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-2xl
            "
          >

            {searchable && (

              <div className="border-b border-slate-100 p-3">

                <div className="relative">

                  <Search
                    size={16}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder={`Search ${label ?? ""}`}
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
                      focus:border-blue-500
                      focus:bg-white
                    "
                  />

                </div>

              </div>

            )}

            <div className="max-h-72 overflow-y-auto">
                            {filtered.length === 0 ? (

                <div className="px-4 py-10 text-center">

                  <p className="text-sm font-medium text-slate-700">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Try another search.
                  </p>

                </div>

              ) : (

                filtered.map((option) => {

                  const isSelected =
                    option.value === value;

                  return (

                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => {

                        if (option.disabled) return;

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
                        ${
                          option.disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-slate-50"
                        }
                        ${
                          isSelected
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

                      {isSelected && (

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

          </div>,

          document.body

        )}

    </>

  );

}
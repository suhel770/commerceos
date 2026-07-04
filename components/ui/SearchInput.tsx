interface SearchInputProps {
  placeholder?: string;
}

export default function SearchInput({
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-80 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}
// src/components/ui/select.tsx
import * as React from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}

export function Select({ options, value, onValueChange, ...props }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
import { CheckCircle, AlertCircle } from "lucide-react"

interface ConsoleProps {
  message: { type: "info" | "error"; text: string } | null
}

export function Console({ message }: ConsoleProps) {
  if (!message) return null

  return (
    <div
      className={`mt-4 p-3 rounded-md flex items-start gap-2 ${
        message.type === "info"
          ? "bg-emerald-900/50 text-emerald-200 border border-emerald-700/30"
          : "bg-red-900/50 text-red-200 border border-red-700/30"
      }`}
    >
      {message.type === "info" ? (
        <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
      )}
      <div className="font-mono text-sm">{message.text}</div>
    </div>
  )
}

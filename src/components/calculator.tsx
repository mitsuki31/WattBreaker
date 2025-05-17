
"use client"

import { useState, useRef } from "react"
import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Console } from "@/components/console"

import {
  MCBStandard,
  MCB_RATING_PRESETS,
  MCB_STANDARDS_INFO,
  calculatePower,
  suggestMCBSize
} from "@/lib/core/mcbCalc"

export function Calculator() {
  const [voltage, setVoltage] = useState<number | "">("");
  const [mcbSize, setMcbSize] = useState<number | "">("");
  const [standardMcb, setStandardMcb] = useState<string>("");
  const [mcbStandard, setMcbStandard] = useState<MCBStandard>(MCBStandard.IEC_60898_1);
  const [powerFactor, setPowerFactor] = useState<number>(1);
  const [isThreePhase, setIsThreePhase] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);
  const [suggestedMCBSize, setSuggestedMCBSize] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "info" | "error"; text: string } | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // Generate MCB size options based on the selected standard
  const getMcbSizeOptions = () => {
    const options = [{ value: "custom", label: "Custom" }];

    MCB_RATING_PRESETS[mcbStandard].forEach((rating) => {
      options.push({ value: rating.toString(), label: `${rating}A` });
    });

    return options;
  }

  const calcPower = () => {
    // Determine which MCB size to use (standard or custom)
    const effectiveMcbSize = standardMcb && standardMcb !== "custom" ? Number(standardMcb) : mcbSize;

    // Check if inputs are empty
    if (voltage === "" || (effectiveMcbSize === "" && (standardMcb === "custom" || standardMcb === ""))) {
      setMessage({ type: "error", text: "Please enter voltage and select an MCB size" });
      setResult(null);
      return;
    }

    // Check for non-positive numbers
    if (Number(voltage) <= 0 || Number(effectiveMcbSize) <= 0) {
      setMessage({ type: "error", text: "Voltage and MCB size must be positive numbers" });
      setResult(null);
      return;
    }

    // Check power factor range
    if (powerFactor < 0 || powerFactor > 1) {
      setMessage({ type: "error", text: "Power factor must be between 0 and 1" });
      setResult(null);
      return;
    }

    // Calculate power based on phase selection
    const power = calculatePower(
      Number(voltage),
      Number(effectiveMcbSize),
      powerFactor,
      { isThreePhase }
    );

    setResult(power);
    try {
      setSuggestedMCBSize(suggestMCBSize(
        power,
        Number(voltage),
        { isThreePhase, standard: mcbStandard }
      ));
    } catch (e: unknown) {
      if (e instanceof Error) {
        const lastMCBSize = MCB_RATING_PRESETS[mcbStandard][MCB_RATING_PRESETS[mcbStandard].length - 1];
        setSuggestedMCBSize(lastMCBSize);
        setMessage({ type: "error", text: e.message });
        return;
      }
    }

    // Determine MCB size label (standard or custom)
    const mcbSizeLabel = standardMcb && standardMcb !== "custom" ? `${standardMcb}A` : `${mcbSize}A`;

    // Create formula text based on phase selection
    const formulaText = isThreePhase
      ? `√3 × ${voltage}V × ${mcbSizeLabel} × ${powerFactor}`
      : `${voltage}V × ${mcbSizeLabel} × ${powerFactor}`;

    setMessage({
      type: "info",
      text: `Calculation successful: ${formulaText} = ${power.toFixed(2)}W`,
    });

    // Smooth scroll to results after calculation
    setTimeout(() => {
      resultRef?.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100);
  }

  // Handle standard MCB selection
  const handleStandardMcbChange = (value: string) => {
    setStandardMcb(value);
    // If a standard MCB is selected (not custom), disable the custom MCB input
    if (!value || value !== "custom") setMcbSize("");
  }

  // Handle MCB standard change
  const handleMcbStandardChange = (value: string) => {
    setMcbStandard(value as MCBStandard);

    // Reset the selected MCB size when changing standards
    setStandardMcb("");
  }

  return (
    <Card className="w-full max-w-xl shadow-xl bg-slate-900/50 border border-slate-700 rounded-xl">
      {/* Card header with title */}
      <CardHeader className="border-b border-slate-700/70">
        <CardTitle className="text-3xl font-bold text-center text-white tracking-widest">MCB Power Calculator</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6 bg-slate-900/50">
        {/* Input fields for voltage, MCB size, and power factor */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voltage" className="text-white">
              Voltage (<span className="font-mono font-light">V</span>)
            </Label>
            <Input
              id="voltage"
              type="number"
              placeholder="Enter voltage in volts"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value ? Number(e.target.value) : "")}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mcbStandard" className="text-white flex items-center gap-2">
              MCB Standard
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-purple-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border border-purple-800 shadow-lg shadow-purple-900/60" side="right">
                    <p className="max-w-[28rem]">Different MCB standards have different rating ranges and applications.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={mcbStandard} onValueChange={handleMcbStandardChange}>
              <SelectTrigger id="mcbStandard" title="Select MCB Standard" className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select MCB standard" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {Object.values(MCBStandard).map((standard) => (
                  <SelectItem key={standard} value={standard}>
                    {MCB_STANDARDS_INFO[standard].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-purple-300 mt-1">{MCB_STANDARDS_INFO[mcbStandard].description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="standardMcb" className="text-white">
              Standard MCB Size (<span className="font-mono font-light">A</span>)
            </Label>
            <Select value={standardMcb} onValueChange={handleStandardMcbChange}>
              <SelectTrigger id="standardMcb" className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a standard MCB size" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
                {getMcbSizeOptions().map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {standardMcb && standardMcb !== "custom" && (
              <p className="text-xs text-purple-300 mt-1">Using standard {standardMcb}A MCB for calculation</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mcbSize" className="text-white">
              Custom MCB Size (<span className="font-mono font-light">A</span>)
            </Label>
            <Input
              id="mcbSize"
              type="number"
              placeholder="Enter custom MCB size in amperes"
              value={mcbSize}
              onChange={(e) => {
                setMcbSize(e.target.value ? Number(e.target.value) : "");
                // If custom MCB is entered, set the standard MCB selection to "custom"
                if (e.target.value) setStandardMcb("custom");
              }}
              disabled={standardMcb !== "" && standardMcb !== "custom"}
              className={`bg-gray-800 border-gray-700 text-white ${standardMcb !== "" && standardMcb !== "custom" ? "opacity-50" : ""
                }`}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="powerFactor" className="text-white">
                Power Factor (<span className="font-mono font-light text-xs">cos φ</span>)
              </Label>
              <span className="text-white font-medium">{powerFactor.toFixed(2)}</span>
            </div>
            <Slider
              id="powerFactor"
              min={0}
              max={1}
              step={0.01}
              value={[powerFactor]}
              onValueChange={(value) => setPowerFactor(value[0])}
              className="py-4"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="threePhase"
              checked={isThreePhase}
              onCheckedChange={(checked) => setIsThreePhase(checked === true)}
              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 hover:border-purple-600 focus-visible:border-purple-600"
            />
            <Label
              htmlFor="threePhase"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
            >
              Use 3-Phase System
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-purple-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-white border border-purple-800 shadow-lg shadow-purple-900/60">
                  <p className="max-w-[22rem]">
                    3-Phase uses the formula: <span className="font-mono font-semibold">P = √3 × V × I × PF</span>
                    <br />
                    Single-phase uses: <span className="font-mono font-semibold">P = V × I × PF</span>
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button onClick={calcPower} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Calculate Power
          </Button>

          {result !== null && (
            <div ref={resultRef} className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-700/30">
              <h3 className="text-lg font-semibold text-white mb-2">Result</h3>
              <p className="text-2xl font-bold text-purple-300">{result.toFixed(2)} Watts</p>
              <div className="text-sm text-purple-400 mt-2 space-y-1">
                <p>
                  {`Using ${(standardMcb && standardMcb !== 'custom') ? standardMcb : mcbSize}A MCB`}
                </p>
                <p>Standard: {MCB_STANDARDS_INFO[mcbStandard].label}</p>
                <p>System: {isThreePhase ? "3-Phase" : "Single-Phase"}</p>
                {/* Only suggest the MCB size if use non-standard MCB size (amps) */}
                <p hidden={standardMcb !== 'custom'}>Suggested Standard MCB Size: {suggestedMCBSize}A</p>
              </div>
            </div>
          )}
        </div>

        <Console message={message} />
      </CardContent>
    </Card>
  )
}

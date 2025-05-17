/** Enum for MCB standard types */
export enum MCBStandard {
  IEC_60898_1 = "IEC_60898-1",  // For residential or commercial use
  IEC_60947_2 = "IEC_60947-2"   // For industrial use
}

/** MCB rating presets */
export const MCB_RATING_PRESETS = Object.freeze({
  [MCBStandard.IEC_60898_1]: [
    1, 2, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125
  ],
  [MCBStandard.IEC_60947_2]: [
    0.5, 1, 2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63,
    100, 160, 250, 400, 630, 800, 1000,
    1600, 2500, 3200, 4000, 5000, 6300
  ]
});

/** MCB Standards information */
export const MCB_STANDARDS_INFO = Object.freeze({
  [MCBStandard.IEC_60898_1]: {
    label: "IEC 60898-1 (Residential/Commercial)",
    description: "For residential or commercial applications with ratings up to 125A.",
  },
  [MCBStandard.IEC_60947_2]: {
    label: "IEC 60947-2 (Industrial)",
    description: "For industrial applications with ratings up to 6300A.",
  },
});

interface UseThreePhaseMCB {
  /** Whether the MCB is a 3-phase system. Default is `false`. */
  isThreePhase?: boolean;
}

/** Options for the MCB Size calculation */
export interface MCBSizeOptions extends UseThreePhaseMCB {
  /**
   * A standard MCB to use, IEC_60898-1 or IEC_60947_2. 
   *
   * Will be ignored if {@link customRatings} is specified. Default is IEC_60898-1.
   * @see {MCB_RATING_PRESETS}
   */
  standard?: MCBStandard;
  /** Custom MCB ratings. */
  customRatings?: number[];
}

/** Options for the power (watt) calculation */
export type CalcPowerOptions = UseThreePhaseMCB;
export type PowerLabel = 'W' | 'kW' | 'MW' | 'GW' | 'TW';
export type LongPowerLabel = 'Watts' | 'Kilo Watts' | 'Mega Watts' | 'Giga Watts' | 'Tera Watts';

/**
 * Returns a label representing the given power value in an appropriate unit.
 *
 * The function converts the power value into a human-readable label, either in
 * short form (e.g., "MW" for Mega Watt) or long form (e.g., "Mega Watt"), based
 * on the `longLabel` parameter.
 *
 * @param power - The power value in watts to be converted into a label.
 * @param longLabel - Optional. If `true`, returns the long form of the label
 * (e.g., "Mega Watt"). If `false` or omitted, returns the short form
 * (e.g., "MW").
 *
 * @returns A string representing the power label in the appropriate unit.
 * The return type is either `PowerLabel` (short form) or `LongPowerLabel` (long form).
 *
 * @example
 * ```typescript
 * getPowerLabel(1e6); // Returns "MW"
 * getPowerLabel(1e6, true); // Returns "Mega Watt"
 * getPowerLabel(500); // Returns "W"
 * getPowerLabel(500, true); // Returns "Watt"
 * ```
 */
export function getPowerLabel(power: number, longLabel?: boolean): PowerLabel | LongPowerLabel {
  if (power >= 1e12) return longLabel ? 'Tera Watts' : 'TW';  // Tera Watts
  if (power >= 1e9) return longLabel ? 'Giga Watts' : 'GW';   // Giga Watts
  if (power >= 1e6) return longLabel ? 'Mega Watts' : 'MW';   // Mega Watts
  if (power >= 1e3) return longLabel ? 'Kilo Watts' : 'kW';   // Kilo Watts
  return longLabel ? 'Watts' : 'W';                           // Watts
}

/**
 * Calculates power in watts from given voltage and current.
 *
 * Used formula to calculate the power (watt):
 * ```
 * P = V * I * PF
 * ```
 *
 * Or, if 3-phase system MCB is used:
 * ```
 * P = √3 * V * I * PF
 * ```
 *
 * Where `V` and `I` must be a positive integer, and `PF` must be in between range 0-1.
 * 
 * @param voltage - Voltage in volts (`V`).
 * @param current - Current in amperes (`I`).
 * @param powerFactor - The power factor (for AC systems) in between range 0-1. Default is `1`.
 * @param options - Options object to configure the calculation.
 *
 * @returns Power in watts (number).
 *
 * @since 1.0.0
 */
export function calculatePower(
  voltage: number,
  current: number,
  powerFactor: number = 1,
  options?: CalcPowerOptions
): number {
  if (voltage <= 0 || current <= 0 || powerFactor <= 0) {
    throw new Error('All input values must be positive numbers');
  }
  if (powerFactor > 1) {
    throw new Error('Power factor value cannot be greater than 1');
  }

  const { isThreePhase = false } = options ?? {};

  // Multiply the voltage by √3 if use 3-phase system
  if (isThreePhase) voltage *= Math.sqrt(3)  // 1.73205...

  // NOTE: P = V * I * PF        ==> 1-phase system
  //       P = √3 * V * I * PF   ==> 3-phase system (already multiplied beforehand)
  return voltage * current * powerFactor;
}

/**
 * Suggest the smallest MCB size that can handle the given wattage.
 *
 * This formula is used to determine the smallest matching MCB size:
 * ```
 * I = P / V
 * ```
 *
 * Or, if the 3-phase system MCB is used:
 * ```
 * I = √3 * P / V
 * ```
 *
 * @param wattage - Power in watts (`P`).
 * @param voltage - Voltage in volts (`V`).
 * @param options - Options object to customize the MCB ratings and other settings.
 *
 * @returns The smallest matching MCB size.
 *
 * @since 1.0.0
 */
export function suggestMCBSize(wattage: number, voltage: number, options?: MCBSizeOptions): number {
  const { standard = MCBStandard.IEC_60898_1, customRatings, isThreePhase = false } = options ?? {};

  if (wattage <= 0 || voltage <= 0) {
    throw new Error("Wattage and voltage must be positive numbers.");
  }

  // Calculate the current and optionally multiply by √3 if use 3-phase system
  const currentRequired = (isThreePhase ? Math.sqrt(3) : 1) * wattage / voltage;

  const ratings = customRatings ?? MCB_RATING_PRESETS[standard];
  // Sort ascending the MCB ratings
  const sortedRatings = [...ratings].sort((a, b) => a - b);

  for (const size of sortedRatings) {
    if (currentRequired <= size) return size;
  }

  throw new Error(
    `Required current (${currentRequired.toFixed(2)}A) exceeds available MCB sizes for standard "${standard}".`
  );
}

import {
  calculatePower,
  suggestMCBSize,
  getPowerLabel,
  MCBStandard
} from "../src/lib/core/mcbCalc";

describe("calculatePower", function () {
  it("calculates power correctly with power factor", function () {
    expect(calculatePower(230, 10, 0.8)).toBeCloseTo(1840);
  });

  it("defaults power factor to 1", function () {
    expect(calculatePower(230, 10)).toBe(2300);
  });

  it("calculates 3-phase power correctly", function () {
    const expectedVal = Math.sqrt(3) * 400 * 10 * 0.9;
    expect(calculatePower(400, 10, 0.9, { isThreePhase: true })).toBe(expectedVal);
  });

  it("throws error for zero or negative inputs", function () {
    expect(() => calculatePower(0, 10)).toThrow();
    expect(() => calculatePower(230, -5)).toThrow();
    expect(() => calculatePower(230, 5, 0)).toThrow();
  });
});

describe("suggestMCBSize", function () {
  it("returns the correct size for IEC 60898-1", function () {
    expect(suggestMCBSize(
      2400,
      230,
      { standard: MCBStandard.IEC_60898_1 }
    )).toBe(13);
  });

  it("returns the correct size for IEC 60947-2", function () {
    expect(suggestMCBSize(
      16000,
      400,
      { standard: MCBStandard.IEC_60947_2 }
    )).toBe(40);
  });

  it("handles 3-phase system", function () {
    expect(suggestMCBSize(
      16000,
      400,
      { standard: MCBStandard.IEC_60947_2, isThreePhase: true }
    )).toBe(160);
  });

  it("uses custom ratings and returns correct result", function () {
    const customRatings = [5, 10, 15];
    expect(suggestMCBSize(
      800,
      230,
      { customRatings }
    )).toBe(5);
  });

  it("sorts custom ratings before selecting", function () {
    const unsortedCustomRatings = [20, 5, 10];
    expect(suggestMCBSize(
      1100,
      230,
      { customRatings: unsortedCustomRatings }
    )).toBe(5);
  });

  it("throws error if wattage or voltage are invalid", function () {
    expect(() => suggestMCBSize(
      0,
      230
    )).toThrow();
    expect(() => suggestMCBSize(
      1000,
      -230
    )).toThrow();
  });

  describe("getPowerLabel", function () {
    it("returns correct short labels for power values", function () {
      expect(getPowerLabel(1e12)).toBe("TW");
      expect(getPowerLabel(1e9)).toBe("GW");
      expect(getPowerLabel(1e6)).toBe("MW");
      expect(getPowerLabel(1e3)).toBe("kW");
      expect(getPowerLabel(500)).toBe("W");
    });

    it("returns correct long labels for power values", function () {
      expect(getPowerLabel(1e12, true)).toBe("Tera Watts");
      expect(getPowerLabel(1e9, true)).toBe("Giga Watts");
      expect(getPowerLabel(1e6, true)).toBe("Mega Watts");
      expect(getPowerLabel(1e3, true)).toBe("Kilo Watts");
      expect(getPowerLabel(500, true)).toBe("Watts");
    });

    it("handles edge cases correctly", function () {
      expect(getPowerLabel(1e12 - 1)).toBe("GW");
      expect(getPowerLabel(1e9 - 1)).toBe("MW");
      expect(getPowerLabel(1e6 - 1)).toBe("kW");
      expect(getPowerLabel(1e3 - 1)).toBe("W");
    });
  });
});

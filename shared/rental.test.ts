import { describe, expect, it } from "vitest";
import { calculateRentalUnits, formatRentalDuration, rentalUnitsForCategory } from "./rental";

describe("rental units", () => {
  it("limits unit choices to suitable options for each category", () => {
    expect(rentalUnitsForCategory("العقارات")).toEqual(["يوم", "أسبوع", "شهر", "سنة"]);
    expect(rentalUnitsForCategory("السيارات")).toContain("ساعة");
    expect(rentalUnitsForCategory("الإلكترونيات")).toEqual(["ساعة", "يوم", "أسبوع"]);
  });

  it("calculates hourly duration across same and consecutive dates", () => {
    expect(calculateRentalUnits("ساعة", "2026-11-02", "2026-11-02", "09:00", "12:00")).toBe(3);
    expect(calculateRentalUnits("ساعة", "2026-11-02", "2026-11-03", "23:00", "01:30")).toBe(3);
    expect(calculateRentalUnits("ساعة", "2026-11-02", "2026-11-02", "12:00", "12:00")).toBeNull();
    expect(calculateRentalUnits("ساعة", "2026-11-02", "2026-11-02")).toBeNull();
  });

  it("rounds daily and weekly rentals up to the next whole unit", () => {
    expect(calculateRentalUnits("يوم", "2026-11-02", "2026-11-04")).toBe(2);
    expect(calculateRentalUnits("أسبوع", "2026-11-02", "2026-11-09")).toBe(1);
    expect(calculateRentalUnits("أسبوع", "2026-11-02", "2026-11-10")).toBe(2);
  });

  it("uses calendar boundaries for months and years", () => {
    expect(calculateRentalUnits("شهر", "2027-01-31", "2027-02-28")).toBe(1);
    expect(calculateRentalUnits("شهر", "2027-01-31", "2027-03-01")).toBe(2);
    expect(calculateRentalUnits("سنة", "2028-02-29", "2029-02-28")).toBe(1);
  });

  it("charges one occasion and formats Arabic duration labels", () => {
    expect(calculateRentalUnits("مناسبة", "2026-11-02", "2026-11-03")).toBe(1);
    expect(formatRentalDuration(2, "أسبوع")).toBe("٢ أسبوعان");
  });
});

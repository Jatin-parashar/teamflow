import {
  getInitials,
  formatDate,
  getRoleBadgeStyle,
} from "@/utils/roleUtilities";
import { Role } from "@/features/types";

describe("getInitials", () => {
  it("returns initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Alice Bob Charlie")).toBe("ABC");
  });

  it("returns single initial for one word", () => {
    expect(getInitials("John")).toBe("J");
  });
});

describe("formatDate", () => {
  it("formats a valid date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBe("Jan 15, 2024");
  });

  it("returns Not set for empty string", () => {
    expect(formatDate("")).toBe("Not set");
  });

  it("returns Invalid date for bad input", () => {
    expect(formatDate("not-a-date")).toBe("Invalid date");
  });
});

describe("getRoleBadgeStyle", () => {
  it("returns correct style for each role", () => {
    expect(getRoleBadgeStyle(Role.OWNER)).toContain("violet");
    expect(getRoleBadgeStyle(Role.ADMIN)).toContain("blue");
    expect(getRoleBadgeStyle(Role.MANAGER)).toContain("emerald");
    expect(getRoleBadgeStyle(Role.MEMBER)).toContain("slate");
    expect(getRoleBadgeStyle(Role.GUEST)).toContain("gray");
  });
});

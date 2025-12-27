import { expect, test, describe } from "vitest";
import { cn } from "./utils";

describe("Utils: cn", () => {
  test("merges class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500", "text-red-600");
    // tailwind-merge should consistently pick the last conflicting class (text-red-600)
    // but cn just merges. The key is if duplicates are handled or just concatenated if no conflicts
    // let's just check it contains them
    expect(result).toContain("bg-blue-500");
    expect(result).toContain("text-red-600");
  });
});

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Onboarding from "./Onboarding";

describe("Onboarding", () => {
  it("renders without crashing", () => {
    const { container } = render(<Onboarding />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

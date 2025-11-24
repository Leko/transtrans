import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CircularProgress } from "./CircularProgress";

describe("CircularProgress", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <CircularProgress size={100} loaded={50} total={100} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders two circles", () => {
    const { container } = render(
      <CircularProgress size={100} loaded={50} total={100} />
    );
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("calculates correct strokeDashoffset for 50% progress", () => {
    const { container } = render(
      <CircularProgress size={100} loaded={50} total={100} />
    );
    const progressCircle = container.querySelectorAll("circle")[1];
    const strokeDashoffset = progressCircle.getAttribute("stroke-dashoffset");
    // radius = 100/2 - 2 = 48, circumference = 2 * PI * 48 ≈ 301.59
    // offset = 301.59 - 0.5 * 301.59 ≈ 150.8
    expect(parseFloat(strokeDashoffset || "0")).toBeCloseTo(150.8, 0);
  });

  it("handles 0% progress", () => {
    const { container } = render(
      <CircularProgress size={100} loaded={0} total={100} />
    );
    const progressCircle = container.querySelectorAll("circle")[1];
    const strokeDasharray = progressCircle.getAttribute("stroke-dasharray");
    const strokeDashoffset = progressCircle.getAttribute("stroke-dashoffset");
    // At 0%, offset should equal circumference
    expect(strokeDasharray).toBe(strokeDashoffset);
  });

  it("handles 100% progress", () => {
    const { container } = render(
      <CircularProgress size={100} loaded={100} total={100} />
    );
    const progressCircle = container.querySelectorAll("circle")[1];
    const strokeDashoffset = progressCircle.getAttribute("stroke-dashoffset");
    // At 100%, offset should be 0
    expect(parseFloat(strokeDashoffset || "0")).toBeCloseTo(0, 0);
  });

  it("uses custom width", () => {
    const { container } = render(
      <CircularProgress size={100} loaded={50} total={100} width={5} />
    );
    const circles = container.querySelectorAll("circle");
    circles.forEach((circle) => {
      expect(circle.getAttribute("stroke-width")).toBe("5");
    });
  });

  it("applies correct viewBox", () => {
    const { container } = render(
      <CircularProgress size={200} loaded={50} total={100} />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 200 200");
  });
});

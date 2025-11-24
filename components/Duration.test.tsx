import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Duration from "./Duration";

describe("Duration", () => {
  it("renders formatted duration", () => {
    render(<Duration ms={5000} />);
    expect(screen.getByText("00:00:05.000")).toBeInTheDocument();
  });

  it("renders zero duration", () => {
    render(<Duration ms={0} />);
    expect(screen.getByText("00:00:00.000")).toBeInTheDocument();
  });

  it("renders complex duration", () => {
    // 1 hour, 23 minutes, 45 seconds, 678 milliseconds
    const ms = 1 * 3600000 + 23 * 60000 + 45 * 1000 + 678;
    render(<Duration ms={ms} />);
    expect(screen.getByText("01:23:45.678")).toBeInTheDocument();
  });

  it("renders inside a span element", () => {
    const { container } = render(<Duration ms={1000} />);
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe("00:00:01.000");
  });
});

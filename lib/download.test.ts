import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadAsFile } from "./download";

describe("downloadAsFile", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let createElementMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickMock = vi.fn();
    createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLMock = vi.fn();

    const mockAnchor = {
      href: "",
      download: "",
      click: clickMock,
    };

    createElementMock = vi.fn().mockReturnValue(mockAnchor);

    global.URL.createObjectURL = createObjectURLMock as typeof URL.createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURLMock as typeof URL.revokeObjectURL;
    vi.spyOn(document, "createElement").mockImplementation(createElementMock as typeof document.createElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates object URL from blob", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    downloadAsFile(blob, "test.txt");

    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
  });

  it("creates an anchor element", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    downloadAsFile(blob, "test.txt");

    expect(createElementMock).toHaveBeenCalledWith("a");
  });

  it("sets the download filename", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    const mockAnchor = { href: "", download: "", click: clickMock };
    createElementMock.mockReturnValue(mockAnchor);

    downloadAsFile(blob, "my-file.txt");

    expect(mockAnchor.download).toBe("my-file.txt");
  });

  it("sets the href to the object URL", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    const mockAnchor = { href: "", download: "", click: clickMock };
    createElementMock.mockReturnValue(mockAnchor);

    downloadAsFile(blob, "test.txt");

    expect(mockAnchor.href).toBe("blob:mock-url");
  });

  it("triggers click on the anchor element", () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    downloadAsFile(blob, "test.txt");

    expect(clickMock).toHaveBeenCalled();
  });

  it("handles different file types", () => {
    const jsonBlob = new Blob([JSON.stringify({ key: "value" })], {
      type: "application/json",
    });
    downloadAsFile(jsonBlob, "data.json");

    expect(createObjectURLMock).toHaveBeenCalledWith(jsonBlob);
  });

  it("handles empty blob", () => {
    const emptyBlob = new Blob([]);
    downloadAsFile(emptyBlob, "empty.txt");

    expect(createObjectURLMock).toHaveBeenCalledWith(emptyBlob);
    expect(clickMock).toHaveBeenCalled();
  });

  it("handles filename with special characters", () => {
    const blob = new Blob(["test"]);
    const mockAnchor = { href: "", download: "", click: clickMock };
    createElementMock.mockReturnValue(mockAnchor);

    downloadAsFile(blob, "file (1).txt");

    expect(mockAnchor.download).toBe("file (1).txt");
  });

  it("handles filename with unicode characters", () => {
    const blob = new Blob(["test"]);
    const mockAnchor = { href: "", download: "", click: clickMock };
    createElementMock.mockReturnValue(mockAnchor);

    downloadAsFile(blob, "ファイル.txt");

    expect(mockAnchor.download).toBe("ファイル.txt");
  });
});

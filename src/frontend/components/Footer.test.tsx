import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@frontend/components/Footer";

describe("Footer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o ano atual", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-06-15T12:00:00"));

    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 2031");
  });
});

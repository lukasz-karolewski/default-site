import { describe, expect, it } from "vitest";
import { extractFaviconFromHtml } from "./faviconDetect";

const BASE = "http://localhost:3000";

describe("extractFaviconFromHtml", () => {
  it("extracts a standard rel=icon link", () => {
    const html = `
      <html><head>
        <link rel="icon" href="/favicon.png">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBe(
      "http://localhost:3000/favicon.png",
    );
  });

  it("extracts a shortcut icon link", () => {
    const html = `
      <html><head>
        <link rel="shortcut icon" href="/icons/fav.ico">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBe(
      "http://localhost:3000/icons/fav.ico",
    );
  });

  it("extracts an apple-touch-icon link", () => {
    const html = `
      <html><head>
        <link rel="apple-touch-icon" href="/apple-icon.png">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBe(
      "http://localhost:3000/apple-icon.png",
    );
  });

  it("resolves a relative path against the base URL", () => {
    const html = `
      <html><head>
        <link rel="icon" href="assets/icon.svg">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, `${BASE}/app/`)).toBe(
      "http://localhost:3000/app/assets/icon.svg",
    );
  });

  it("returns an absolute URL as-is", () => {
    const html = `
      <html><head>
        <link rel="icon" href="https://cdn.example.com/icon.png">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBe(
      "https://cdn.example.com/icon.png",
    );
  });

  it("returns the first icon link when multiple are present", () => {
    const html = `
      <html><head>
        <link rel="icon" type="image/png" href="/first.png">
        <link rel="icon" type="image/svg+xml" href="/second.svg">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBe(
      "http://localhost:3000/first.png",
    );
  });

  it("returns null when no favicon link exists", () => {
    const html = `
      <html><head>
        <link rel="stylesheet" href="/styles.css">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBeNull();
  });

  it("returns null for empty HTML", () => {
    expect(extractFaviconFromHtml("", BASE)).toBeNull();
  });

  it("handles a link with no href gracefully", () => {
    const html = `
      <html><head>
        <link rel="icon">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBeNull();
  });

  it("is case-insensitive for the rel attribute", () => {
    const html = `
      <html><head>
        <link rel="ICON" href="/upper.ico">
      </head><body></body></html>`;
    expect(extractFaviconFromHtml(html, BASE)).toBe(
      "http://localhost:3000/upper.ico",
    );
  });
});

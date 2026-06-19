import type { Article } from "@/lib/types";

const COLUMNS: Array<[string, (a: Article) => string]> = [
  ["publishedAt", (a) => a.publishedAt],
  ["source", (a) => a.source],
  ["title", (a) => a.title],
  ["cities", (a) => a.cities.join("|")],
  ["categories", (a) => a.categories.join("|")],
  ["link", (a) => a.link],
];

function escape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function articlesToCsv(articles: Article[]): string {
  const header = COLUMNS.map(([name]) => name).join(",");
  const rows = articles.map((a) => COLUMNS.map(([, get]) => escape(get(a))).join(","));
  return [header, ...rows].join("\n");
}

/** Trigger a browser download of `content` as a file. */
export function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

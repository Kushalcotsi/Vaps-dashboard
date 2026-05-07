/**
 * Utility to export data to CSV, matching the reference implementation's formatting.
 */

export function exportToCsv(filename: string, columns: { label: string, key: string, fmt?: (v: any) => string }[], rows: any[]) {
  const headers = columns.map(col => csvValue(col.label)).join(",");
  const body = rows.map(row => 
    columns.map(col => {
      const val = row[col.key];
      return csvValue(col.fmt ? col.fmt(val) : val);
    }).join(",")
  ).join("\n");

  const csvContent = `${headers}\n${body}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function csvValue(value: any): string {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

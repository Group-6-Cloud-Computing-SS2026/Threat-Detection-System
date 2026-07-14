export function formatSeconds(value: number | null) {
  return value === null ? "N/A" : `${value.toFixed(3)}s`;
}

export function formatOptionalNumber(
  value: number | null,
  digits = 2,
  suffix = "x",
) {
  return value === null ? "N/A" : `${value.toFixed(digits)}${suffix}`;
}

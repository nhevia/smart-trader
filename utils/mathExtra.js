export function roundFloor(value, decimals) {
  return Number(Math.floor(value + 'e' + decimals) + 'e-' + decimals)
}

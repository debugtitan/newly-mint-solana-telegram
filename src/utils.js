export function formatNumber(number) {
    if (number >= 1_000_000_000_000_000) {
      return (number / 1_000_000_000_000_000).toFixed(2) + "Q";
    } else if (number >= 1_000_000_000_000) {
      return (number / 1_000_000_000_000).toFixed(2) + "T";
    } else if (number >= 1_000_000_000) {
      return (number / 1_000_000_000).toFixed(2) + "B";
    } else if (number >= 1_000_000) {
      return (number / 1_000_000).toFixed(2) + "M";
    } else if (number >= 1_000) {
      return (number / 1_000).toFixed(2) + "K";
    } else {
      return number.toString();
    }
  }
  
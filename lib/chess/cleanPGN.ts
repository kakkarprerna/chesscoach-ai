export function cleanPGN(pgn: string): string {
  let result = "";
  let braceDepth = 0;
  let variationDepth = 0;
  let semicolonComment = false;

  for (let i = 0; i < pgn.length; i++) {
    const char = pgn[i];

    if (semicolonComment) {
      if (char === "\n") {
        semicolonComment = false;
        result += "\n";
      }
      continue;
    }

    if (braceDepth > 0) {
      if (char === "{") {
        braceDepth++;
      } else if (char === "}") {
        braceDepth--;
      }
      continue;
    }

    if (variationDepth > 0) {
      if (char === "{") {
        braceDepth = 1;
      } else if (char === "(") {
        variationDepth++;
      } else if (char === ")") {
        variationDepth--;
      }
      continue;
    }

    if (char === "{") {
      braceDepth = 1;
      continue;
    }

    if (char === "(") {
      variationDepth = 1;
      continue;
    }

    if (char === ";") {
      semicolonComment = true;
      continue;
    }

    if (char === "$") {
      while (
        i + 1 < pgn.length &&
        /[0-9]/.test(pgn[i + 1])
      ) {
        i++;
      }
      continue;
    }

    result += char;
  }

  return result
    .replace(/\s+/g, " ")
    .trim();
}

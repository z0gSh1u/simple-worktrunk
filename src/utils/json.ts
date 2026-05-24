export function findJsonStart(output: string): number {
  const objectIndex = output.indexOf('{');
  const arrayIndex = output.indexOf('[');

  if (objectIndex === -1) {
    return arrayIndex;
  }

  if (arrayIndex === -1) {
    return objectIndex;
  }

  return Math.min(objectIndex, arrayIndex);
}

export function extractFirstJsonValue(output: string): string | null {
  const start = findJsonStart(output);

  if (start === -1) {
    return null;
  }

  const opening = output[start];
  const closing = opening === '{' ? '}' : ']';
  const stack = [closing];
  let inString = false;
  let escaped = false;

  for (let index = start + 1; index < output.length; index += 1) {
    const char = output[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      stack.push('}');
      continue;
    }

    if (char === '[') {
      stack.push(']');
      continue;
    }

    if (char === '}' || char === ']') {
      if (stack.pop() !== char) {
        return null;
      }

      if (stack.length === 0) {
        return output.slice(start, index + 1);
      }
    }
  }

  return null;
}

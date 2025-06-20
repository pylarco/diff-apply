// diff-apply-alvamind/src/extract-text.service.ts
import Alvamind from 'alvamind';
import { distance } from "fastest-levenshtein";
import { compareTwoStrings } from "string-similarity";

export const textService = Alvamind({ name: 'extract-text.service' })
  .decorate('textService', {

    addLineNumbers: (content: string, startLine: number = 1): string => {
      const lines = content.split("\n");
      const maxLineNumberWidth = String(startLine + lines.length - 1).length;
      return lines
        .map((line, index) => {
          const lineNumber = String(startLine + index).padStart(maxLineNumberWidth, " ");
          return `${lineNumber} | ${line}`;
        })
        .join("\n");
    },
    everyLineHasLineNumbers: (content: string): boolean => {
      const lines = content.split(/\r?\n/);
      return lines.length > 0 && lines.every((line) => /^\s*\d+\s+\|(?!\|)/.test(line));
    },

    stripLineNumbers: (content: string): string => {
      // Split into lines to handle each line individually
      const lines = content.split(/\r?\n/);

      // Process each line
      const processedLines = lines.map((line) => {
        // Match line number pattern and capture everything after the pipe
        const match = line.match(/^\s*\d+\s+\|(?!\|)\s?(.*)$/);
        return match ? match[1] : line;
      });

      // Join back with original line endings
      const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
      return processedLines.join(lineEnding);
    },

    getLevenshteinSimilarity: (original: string, search: string): number => {
      if (search === "") {
        return 1;
      }
      const normalize = (str: string) => str.replace(/\s+/g, " ").trim();
      const normalizedOriginal = normalize(original);
      const normalizedSearch = normalize(search);
      if (normalizedOriginal === normalizedSearch) {
        return 1;
      }
      const dist = distance(normalizedOriginal, normalizedSearch);
      const maxLength = Math.max(normalizedOriginal.length, normalizedSearch.length);
      return 1 - dist / maxLength;
    },

    getStringSimilarity: (str1: string, str2: string): number => {
      return compareTwoStrings(str1, str2);
    }
  });
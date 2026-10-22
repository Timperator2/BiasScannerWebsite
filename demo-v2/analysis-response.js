(() => {
  "use strict";

  const namespace = (globalThis.__BIASSCANNER__ ||= {});
  if (namespace.analysisResponse) return;

  class InvalidAnalysisError extends Error {
    constructor(message) {
      super(message);
      this.name = "InvalidAnalysisError";
    }
  }

  function extractFirstJsonObject(source) {
    let start = -1;
    let depth = 0;
    let quoted = false;
    let escaped = false;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') quoted = false;
        continue;
      }
      if (character === '"') quoted = true;
      else if (character === "{") {
        if (depth === 0) start = index;
        depth += 1;
      } else if (character === "}" && depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) return source.slice(start, index + 1);
      }
    }
    return "";
  }

  function removeTrailingCommas(source) {
    let result = "";
    let quoted = false;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        result += character;
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') quoted = false;
        continue;
      }
      if (character === '"') {
        quoted = true;
        result += character;
        continue;
      }
      if (character === ",") {
        let lookahead = index + 1;
        while (/\s/u.test(source[lookahead] || "")) lookahead += 1;
        if (["}", "]"].includes(source[lookahead])) continue;
      }
      result += character;
    }
    return result;
  }

  function parseJsonWithoutDuplicateKeys(source) {
    let index = 0;
    const fail = (message) => {
      throw new InvalidAnalysisError(`${message} at JSON offset ${index}.`);
    };
    const skipWhitespace = () => {
      while (/\s/u.test(source[index] || "")) index += 1;
    };
    const parseString = () => {
      if (source[index] !== '"') fail("Expected a JSON string");
      const start = index;
      index += 1;
      let escaped = false;
      while (index < source.length) {
        const character = source[index];
        index += 1;
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') {
          try {
            return JSON.parse(source.slice(start, index));
          } catch {
            fail("Invalid JSON string");
          }
        } else if (character.charCodeAt(0) < 0x20) {
          fail("Unescaped control character in JSON string");
        }
      }
      fail("Unterminated JSON string");
      return "";
    };
    const parseValue = () => {
      skipWhitespace();
      const character = source[index];
      if (character === '"') return parseString();
      if (character === "{") {
        index += 1;
        const result = {};
        const keys = new Set();
        skipWhitespace();
        if (source[index] === "}") {
          index += 1;
          return result;
        }
        while (index < source.length) {
          skipWhitespace();
          const key = parseString();
          if (keys.has(key)) throw new InvalidAnalysisError(`Duplicate JSON key: ${key}.`);
          keys.add(key);
          skipWhitespace();
          if (source[index] !== ":") fail("Expected ':' after an object key");
          index += 1;
          result[key] = parseValue();
          skipWhitespace();
          if (source[index] === "}") {
            index += 1;
            return result;
          }
          if (source[index] !== ",") fail("Expected ',' or '}' in object");
          index += 1;
        }
        fail("Unterminated JSON object");
      }
      if (character === "[") {
        index += 1;
        const result = [];
        skipWhitespace();
        if (source[index] === "]") {
          index += 1;
          return result;
        }
        while (index < source.length) {
          result.push(parseValue());
          skipWhitespace();
          if (source[index] === "]") {
            index += 1;
            return result;
          }
          if (source[index] !== ",") fail("Expected ',' or ']' in array");
          index += 1;
        }
        fail("Unterminated JSON array");
      }
      const remainder = source.slice(index);
      for (const [literal, value] of [["true", true], ["false", false], ["null", null]]) {
        if (remainder.startsWith(literal)) {
          index += literal.length;
          return value;
        }
      }
      const number = remainder.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u)?.[0];
      if (number) {
        index += number.length;
        return Number(number);
      }
      fail("Unexpected JSON value");
      return null;
    };

    const value = parseValue();
    skipWhitespace();
    if (index !== source.length) fail("Unexpected data after the JSON value");
    return value;
  }

  function parseAnalysis(body) {
    const source = String(body || "")
      .trim()
      .replace(/^```(?:json)?\s*/iu, "")
      .replace(/\s*```$/u, "");
    const extracted = extractFirstJsonObject(source);
    const candidates = [...new Set([source, extracted].filter(Boolean))];
    let lastError = null;

    for (const candidate of candidates) {
      for (const variant of [...new Set([candidate, removeTrailingCommas(candidate)])]) {
        try {
          return parseJsonWithoutDuplicateKeys(variant);
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError || new InvalidAnalysisError("No JSON object was present in the response.");
  }

  function cleanString(value, field) {
    if (typeof value !== "string" || !value.trim()) {
      throw new InvalidAnalysisError(`${field} must be a non-empty string.`);
    }
    return value.trim();
  }

  function canonicalType(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    return namespace.taxonomy?.lookup(value.trim(), "en")?.canonicalName || "";
  }

  function normalizeAnalysis(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new InvalidAnalysisError("The analysis root must be an object.");
    }
    if (!Array.isArray(value.sentences)) {
      throw new InvalidAnalysisError("sentences must be an array.");
    }

    const normalized = value.sentences.flatMap((entry, originalIndex) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new InvalidAnalysisError(`Sentence ${originalIndex + 1} must be an object.`);
      }
      const hasPrimary = Object.prototype.hasOwnProperty.call(entry, "primary_type");
      const rawPrimary = hasPrimary ? entry.primary_type : entry.bias_type;
      const legacyNoBias = !hasPrimary
        && !Object.prototype.hasOwnProperty.call(entry, "bias_types")
        && ["-", "none", "no bias", "kein bias"].includes(String(rawPrimary || "").trim().toLocaleLowerCase());
      if (legacyNoBias) return [];
      const requestedPrimary = canonicalType(rawPrimary);
      const hasTypeList = Object.prototype.hasOwnProperty.call(entry, "bias_types");
      if (hasTypeList && !Array.isArray(entry.bias_types)) {
        throw new InvalidAnalysisError(`sentences[${originalIndex}].bias_types must be an array.`);
      }
      const rawTypes = hasTypeList ? entry.bias_types : (requestedPrimary ? [requestedPrimary] : []);
      const seen = new Set();
      const biasTypes = [];
      for (const rawType of rawTypes) {
        const type = canonicalType(rawType);
        if (type && !seen.has(type)) {
          seen.add(type);
          biasTypes.push(type);
        }
      }
      if (!biasTypes.length) {
        throw new InvalidAnalysisError(`Sentence ${originalIndex + 1} has no valid bias type.`);
      }
      const primaryType = requestedPrimary && seen.has(requestedPrimary)
        ? requestedPrimary
        : (biasTypes.length === 1 ? biasTypes[0] : "");
      if (primaryType) {
        biasTypes.splice(biasTypes.indexOf(primaryType), 1);
        biasTypes.unshift(primaryType);
      }

      const strength = typeof entry.bias_strength === "string"
        && /^\d+(?:\.\d+)?$/u.test(entry.bias_strength.trim())
        ? Number(entry.bias_strength)
        : entry.bias_strength;
      if (!Number.isFinite(strength) || strength <= 0 || strength > 1) {
        throw new InvalidAnalysisError(`Sentence ${originalIndex + 1} has an invalid bias_strength.`);
      }
      const normalizedStrength = Math.round((strength + Number.EPSILON) * 10) / 10;
      if (normalizedStrength < 0.1) {
        throw new InvalidAnalysisError(`Sentence ${originalIndex + 1} has an invalid bias_strength.`);
      }
      const explanation = cleanString(
        entry.bias_explanation ?? entry.bias_description,
        `sentences[${originalIndex}].bias_explanation`,
      );
      return [{
        text: cleanString(entry.text, `sentences[${originalIndex}].text`),
        primary_type: primaryType,
        bias_types: biasTypes,
        bias_strength: normalizedStrength,
        bias_explanation: explanation,
        bias_type: primaryType,
        bias_description: explanation,
        originalIndex,
      }];
    });

    const overall = value.overall_bias ?? value["overall bias"] ?? value.conclusion;
    const conclusion = cleanString(
      typeof overall === "string" ? overall : overall?.conclusion,
      "overall_bias.conclusion",
    );

    const unique = [];
    const seenEntries = new Set();
    for (const sentence of normalized) {
      const key = JSON.stringify([
        sentence.text,
        sentence.primary_type,
        sentence.bias_types,
        sentence.bias_strength,
        sentence.bias_explanation,
      ]);
      if (!seenEntries.has(key)) {
        seenEntries.add(key);
        unique.push(sentence);
      }
    }
    return { sentences: unique, conclusion };
  }

  function editDistance(left, right) {
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= right.length; column += 1) {
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
        );
      }
      previous = current;
    }
    return previous[right.length];
  }

  function structureSignature(value) {
    return value
      .replace(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu, "T")
      .replace(/\s+/gu, " ")
      .trim();
  }

  function outerPunctuation(value) {
    const tokens = namespace.textMatcher.tokenize(value);
    if (!tokens.length) return [value, ""];
    return [value.slice(0, tokens[0].start), value.slice(tokens.at(-1).end)];
  }

  function tokenOverlap(left, right) {
    const counts = new Map();
    for (const token of left) counts.set(token, (counts.get(token) || 0) + 1);
    let shared = 0;
    for (const token of right) {
      const count = counts.get(token) || 0;
      if (count > 0) {
        shared += 1;
        counts.set(token, count - 1);
      }
    }
    return shared / Math.max(left.length, right.length);
  }

  function alignOuterPunctuation(index, quote, match) {
    if (match.strategy !== "token-fuzzy") return match;
    const normalizedQuote = namespace.textMatcher.normalizeText(quote);
    const tokens = namespace.textMatcher.tokenize(normalizedQuote);
    if (!tokens.length) return match;
    const prefix = normalizedQuote.slice(0, tokens[0].start);
    const suffix = normalizedQuote.slice(tokens.at(-1).end);
    let { start, end } = match;
    if (prefix && index.text.slice(Math.max(0, start - prefix.length), start) === prefix) {
      start -= prefix.length;
    }
    if (suffix && index.text.slice(end, end + suffix.length) === suffix) {
      end += suffix.length;
    }
    return { ...match, start, end };
  }

  function isSafeMatch(index, quote, match) {
    if (!match) return false;
    const aligned = alignOuterPunctuation(index, quote, match);
    if (aligned.strategy === "normalized-exact") return aligned;
    const query = namespace.textMatcher.normalizeText(quote);
    const candidate = index.text.slice(aligned.start, aligned.end);
    const queryTokens = namespace.textMatcher.tokenize(query).map((token) => token.value);
    const candidateTokens = namespace.textMatcher.tokenize(candidate).map((token) => token.value);
    if (queryTokens.length !== candidateTokens.length || queryTokens.length < 4) return false;
    const differences = queryTokens
      .map((token, tokenIndex) => [token, candidateTokens[tokenIndex]])
      .filter(([left, right]) => left !== right);
    const minorTypo = queryTokens.length === candidateTokens.length
      && differences.length === 1
      && editDistance(...differences[0]) <= 2
      && structureSignature(query) === structureSignature(candidate);
    if (minorTypo) return aligned;

    const lengthRatio = Math.min(queryTokens.length, candidateTokens.length)
      / Math.max(queryTokens.length, candidateTokens.length);
    const sameAnchors = queryTokens[0] === candidateTokens[0]
      && queryTokens.at(-1) === candidateTokens.at(-1);
    const sameOuterPunctuation = outerPunctuation(query).join("\u0000")
      === outerPunctuation(candidate).join("\u0000");
    if (queryTokens.length < 6
      || aligned.score < 0.86
      || lengthRatio < 0.8
      || tokenOverlap(queryTokens, candidateTokens) < 0.8
      || !sameAnchors
      || !sameOuterPunctuation) {
      return false;
    }
    return aligned;
  }

  function locateUniqueQuote(index, quote) {
    const first = isSafeMatch(index, quote, namespace.textMatcher.findBestMatch(index, quote));
    if (!first) throw new InvalidAnalysisError("A reported passage could not be verified in the article.");
    const second = isSafeMatch(
      index,
      quote,
      namespace.textMatcher.findBestMatch(index, quote, [{ start: first.start, end: first.end }]),
    );
    if (second && first.score - second.score < 0.08) {
      throw new InvalidAnalysisError("A reported passage is ambiguous in the article.");
    }
    return first;
  }

  function repairAgainstArticle(analysis, articleText) {
    const index = namespace.textMatcher.buildStringIndex(articleText);
    if (!index.text) throw new InvalidAnalysisError("The extracted article is empty.");
    const located = analysis.sentences.map((sentence) => {
      const match = locateUniqueQuote(index, sentence.text);
      return { sentence, match };
    }).sort((left, right) => left.match.start - right.match.start);

    const resolved = [];
    let occupiedEnd = 0;
    for (const { sentence, match } of located) {
      if (match.end <= occupiedEnd) continue;
      const nonOverlappingMatch = {
        ...match,
        start: Math.max(match.start, occupiedEnd),
      };
      const originalText = namespace.textMatcher
        .sourceSliceForMatch(index, nonOverlappingMatch)
        .trim();
      if (!originalText) continue;
      resolved.push({ ...sentence, text: originalText });
      occupiedEnd = match.end;
    }
    return {
      conclusion: analysis.conclusion,
      sentences: resolved.map((sentence, originalIndex) => ({ ...sentence, originalIndex })),
    };
  }

  function process(body, articleText) {
    return repairAgainstArticle(normalizeAnalysis(parseAnalysis(body)), articleText);
  }

  async function requestWithSingleRetry(
    request,
    articleText,
    { onInvalid = () => {}, shouldContinue = () => true } = {},
  ) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await request(attempt);
      if (!shouldContinue()) return null;
      try {
        return process(response?.body, articleText);
      } catch (error) {
        lastError = error;
        onInvalid(error, attempt + 1);
      }
    }
    throw lastError;
  }

  namespace.analysisResponse = {
    InvalidAnalysisError,
    extractFirstJsonObject,
    normalizeAnalysis,
    parseAnalysis,
    process,
    repairAgainstArticle,
    requestWithSingleRetry,
  };
})();

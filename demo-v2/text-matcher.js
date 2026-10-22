(() => {
  "use strict";

  const namespace = (globalThis.__BIASSCANNER__ ||= {});
  if (namespace.textMatcher) return;

  const IGNORED_SELECTOR = [
    "script",
    "style",
    "noscript",
    "template",
    "textarea",
    "input",
    "select",
    "option",
    "button",
    "svg",
    "canvas",
    "[data-biasscanner-ui]",
  ].join(",");
  const HIDDEN_SELECTOR = "[hidden], [aria-hidden='true']";

  function normalizeFragment(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, "")
      .replace(/[\u2018\u2019\u201A\u201B\u2032]/gu, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/gu, '"')
      .replace(/[\u2010-\u2015\u2212]/gu, "-")
      .replace(/\u2026/gu, "...")
      .replace(/\s/gu, " ")
      .toLocaleLowerCase();
  }

  function normalizeText(value) {
    return normalizeFragment(value).replace(/ +/gu, " ").trim();
  }

  function buildStringIndex(value) {
    const source = String(value ?? "");
    const textParts = [];
    const map = [];
    let previousWasSpace = true;

    for (let offset = 0; offset < source.length;) {
      const codePoint = source.codePointAt(offset);
      const character = String.fromCodePoint(codePoint);
      const endOffset = offset + character.length;
      const normalized = normalizeFragment(character);

      for (const outputCharacter of normalized) {
        if (outputCharacter === " ") {
          if (!previousWasSpace) {
            textParts.push(" ");
            map.push({ startOffset: offset, endOffset });
            previousWasSpace = true;
          } else if (map.length && textParts.at(-1) === " ") {
            map.at(-1).endOffset = endOffset;
          }
        } else {
          textParts.push(outputCharacter);
          map.push({ startOffset: offset, endOffset });
          previousWasSpace = false;
        }
      }
      offset = endOffset;
    }

    while (textParts.at(-1) === " ") {
      textParts.pop();
      map.pop();
    }
    return { source, text: textParts.join(""), map };
  }

  function sourceSliceForMatch(index, match) {
    const first = index?.map?.[match?.start];
    const last = index?.map?.[Math.max(match?.start || 0, (match?.end || 0) - 1)];
    if (!first || !last || typeof index.source !== "string") return "";
    return index.source.slice(first.startOffset, last.endOffset);
  }

  function tokenize(normalizedText) {
    const tokens = [];
    const expression = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu;
    let match;
    while ((match = expression.exec(normalizedText))) {
      tokens.push({ value: match[0], start: match.index, end: expression.lastIndex });
    }
    return tokens;
  }

  function isVisibleTextNode(node, visibilityCache, includeCssHidden) {
    const parent = node.parentElement;
    if (!parent || !node.nodeValue?.trim() || parent.closest(IGNORED_SELECTOR)) return false;
    if (!includeCssHidden && parent.closest(HIDDEN_SELECTOR)) return false;
    if (includeCssHidden) return true;

    function isVisibleElement(element) {
      if (!element) return true;
      if (visibilityCache.has(element)) return visibilityCache.get(element);
      const ownStyle = globalThis.getComputedStyle?.(element);
      let visible = !ownStyle || !["hidden", "collapse"].includes(ownStyle.visibility);
      let ancestor = element;
      while (visible && ancestor) {
        const style = globalThis.getComputedStyle?.(ancestor);
        if (style?.display === "none") visible = false;
        ancestor = ancestor.parentElement;
      }
      visibilityCache.set(element, visible);
      return visible;
    }
    return isVisibleElement(parent);
  }

  function buildTextIndex(root, options = {}) {
    const textParts = [];
    const map = [];
    const visibilityCache = new WeakMap();
    const ownerDocument = root.ownerDocument || document;
    const walker = ownerDocument.createTreeWalker(
      root,
      globalThis.NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return isVisibleTextNode(node, visibilityCache, options.includeCssHidden === true)
            ? globalThis.NodeFilter.FILTER_ACCEPT
            : globalThis.NodeFilter.FILTER_REJECT;
        },
      },
    );

    let previousWasSpace = true;
    let node;
    while ((node = walker.nextNode())) {
      if (!previousWasSpace) {
        textParts.push(" ");
        map.push({ node, startOffset: 0, endOffset: 0, separator: true });
        previousWasSpace = true;
      }

      const source = node.nodeValue || "";
      for (let offset = 0; offset < source.length;) {
        const codePoint = source.codePointAt(offset);
        const character = String.fromCodePoint(codePoint);
        const endOffset = offset + character.length;
        const normalized = normalizeFragment(character);

        for (const outputCharacter of normalized) {
          if (outputCharacter === " ") {
            if (!previousWasSpace) {
              textParts.push(" ");
              map.push({ node, startOffset: offset, endOffset, separator: false });
              previousWasSpace = true;
            }
          } else {
            textParts.push(outputCharacter);
            map.push({ node, startOffset: offset, endOffset, separator: false });
            previousWasSpace = false;
          }
        }
        offset = endOffset;
      }
    }

    while (textParts.at(-1) === " ") {
      textParts.pop();
      map.pop();
    }

    return { text: textParts.join(""), map };
  }

  function rangesOverlap(left, right) {
    return left.start < right.end && right.start < left.end;
  }

  function isAvailable(candidate, excludedRanges) {
    return !excludedRanges.some((range) => rangesOverlap(candidate, range));
  }

  function tokenEditSimilarity(left, right) {
    if (!left.length || !right.length) return 0;
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

    for (let row = 1; row <= left.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= right.length; column += 1) {
        const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + substitutionCost,
        );
      }
      previous = current;
    }

    return 1 - previous[right.length] / Math.max(left.length, right.length);
  }

  function multisetOverlap(left, right) {
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
    return (2 * shared) / (left.length + right.length);
  }

  function scoreTokenWindow(queryValues, candidateValues) {
    const orderScore = tokenEditSimilarity(queryValues, candidateValues);
    const overlapScore = multisetOverlap(queryValues, candidateValues);
    const lengthScore = Math.min(queryValues.length, candidateValues.length)
      / Math.max(queryValues.length, candidateValues.length);
    return orderScore * 0.7 + overlapScore * 0.2 + lengthScore * 0.1;
  }

  function fuzzyThreshold(tokenCount) {
    if (tokenCount <= 5) return 0.9;
    if (tokenCount <= 10) return 0.82;
    if (tokenCount <= 20) return 0.76;
    return 0.72;
  }

  function collectCandidateStarts(pageTokens, queryTokens) {
    const positions = new Map();
    pageTokens.forEach((token, index) => {
      const list = positions.get(token.value) || [];
      list.push(index);
      positions.set(token.value, list);
    });

    const anchors = queryTokens
      .map((token, index) => ({ token: token.value, index, occurrences: positions.get(token.value) || [] }))
      .filter((entry) => entry.token.length >= 4 && entry.occurrences.length > 0)
      .sort((left, right) => left.occurrences.length - right.occurrences.length)
      .slice(0, 3);

    const starts = new Set();
    for (const anchor of anchors) {
      for (const pageIndex of anchor.occurrences.slice(0, 250)) {
        const estimatedStart = pageIndex - anchor.index;
        for (let drift = -2; drift <= 2; drift += 1) {
          const start = estimatedStart + drift;
          if (start >= 0 && start < pageTokens.length) starts.add(start);
        }
      }
    }

    if (!starts.size) {
      const step = pageTokens.length > 5_000 ? 2 : 1;
      for (let index = 0; index < pageTokens.length; index += step) starts.add(index);
    }
    return [...starts].slice(0, 2_000);
  }

  function findBestMatch(index, quote, excludedRanges = []) {
    const query = normalizeText(quote);
    if (!query) return null;

    let exactStart = index.text.indexOf(query);
    while (exactStart !== -1) {
      const candidate = { start: exactStart, end: exactStart + query.length };
      if (isAvailable(candidate, excludedRanges)) {
        return { ...candidate, score: 1, strategy: "normalized-exact" };
      }
      exactStart = index.text.indexOf(query, exactStart + 1);
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length < 4) return null;

    const pageTokens = tokenize(index.text);
    const queryValues = queryTokens.map((token) => token.value);
    const starts = collectCandidateStarts(pageTokens, queryTokens);
    const variation = Math.max(2, Math.ceil(queryTokens.length * 0.12));
    const lengths = [...new Set([
      Math.max(4, queryTokens.length - variation),
      queryTokens.length,
      queryTokens.length + variation,
    ])];
    let best = null;

    for (const tokenStart of starts) {
      for (const tokenLength of lengths) {
        const tokenEnd = Math.min(pageTokens.length, tokenStart + tokenLength);
        if (tokenEnd - tokenStart < 4) continue;
        const start = pageTokens[tokenStart].start;
        const end = pageTokens[tokenEnd - 1].end;
        const range = { start, end };
        if (!isAvailable(range, excludedRanges)) continue;

        const candidateValues = pageTokens
          .slice(tokenStart, tokenEnd)
          .map((token) => token.value);
        const score = scoreTokenWindow(queryValues, candidateValues);
        if (!best || score > best.score) {
          best = { ...range, score, strategy: "token-fuzzy" };
        }
      }
    }

    if (!best || best.score < fuzzyThreshold(queryTokens.length)) return null;
    return best;
  }

  function domSegmentsForMatch(index, match) {
    const entries = index.map.slice(match.start, match.end).filter((entry) => !entry.separator);
    const segments = [];

    for (const entry of entries) {
      const previous = segments.at(-1);
      if (previous?.node === entry.node && entry.startOffset <= previous.endOffset) {
        previous.endOffset = Math.max(previous.endOffset, entry.endOffset);
      } else {
        segments.push({
          node: entry.node,
          startOffset: entry.startOffset,
          endOffset: entry.endOffset,
        });
      }
    }
    return segments.filter((segment) => segment.endOffset > segment.startOffset);
  }

  namespace.textMatcher = {
    buildStringIndex,
    buildTextIndex,
    domSegmentsForMatch,
    findBestMatch,
    normalizeText,
    sourceSliceForMatch,
    tokenize,
  };
})();


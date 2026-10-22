(() => {
  "use strict";

  const namespace = (globalThis.__BIASSCANNER__ ||= {});
  if (namespace.highlighter) return;

  const HIGHLIGHT_SELECTOR = "[data-biasscanner-highlight='true']";
  const TOOLTIP_HOST_ID = "biasscanner-highlight-tooltip-host";
  const READY_DELAY_MS = 1_500;
  const TRANSFER_DELAY_MS = 3_000;
  const tooltipManagers = new WeakMap();
  const feedbackCopy = {
    en: { question: "Do you agree with this assessment?", agree: "Yes", disagree: "No", why: "Why?" },
    de: { question: "Stimmst du dieser Bewertung zu?", agree: "Ja", disagree: "Nein", why: "Wieso?" },
  };

  function clearHighlights(documentObject = document) {
    const highlights = [...documentObject.querySelectorAll(HIGHLIGHT_SELECTOR)];
    for (const highlight of highlights) {
      const parent = highlight.parentNode;
      if (!parent) continue;
      const contents = documentObject.createDocumentFragment();
      while (highlight.firstChild) contents.appendChild(highlight.firstChild);
      parent.replaceChild(contents, highlight);
      parent.normalize();
    }
  }

  function sentenceTypes(sentence) {
    const values = [
      sentence.primary_type || sentence.bias_type,
      ...(Array.isArray(sentence.bias_types) ? sentence.bias_types : []),
    ];
    const seen = new Set();
    return values.filter((value) => {
      if (typeof value !== "string" || !value.trim()) return false;
      const key = value.trim().toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((value) => value.trim());
  }

  function sentenceExplanation(sentence) {
    return sentence.bias_explanation || sentence.bias_description || "";
  }

  function primaryType(sentence) {
    return typeof (sentence.primary_type || sentence.bias_type) === "string"
      ? (sentence.primary_type || sentence.bias_type).trim()
      : "";
  }

  function highlightColors(sentence) {
    const primary = primaryType(sentence);
    const primaryEntry = primary ? namespace.taxonomy?.lookup(primary, "en") : null;
    if (primaryEntry?.highlightColor) return [primaryEntry.highlightColor];
    return [...new Set(sentenceTypes(sentence)
      .map((type) => namespace.taxonomy?.lookup(type, "en")?.highlightColor)
      .filter(Boolean))];
  }

  function resolvedTaxonomy(sentence) {
    const requestedTypes = primaryType(sentence)
      ? [primaryType(sentence)]
      : sentenceTypes(sentence);
    return requestedTypes
      .map((type) => namespace.taxonomy?.lookup(type, "en"))
      .filter(Boolean);
  }

  function protectTooltipHost(element) {
    const declarations = {
      all: "initial",
      position: "fixed",
      inset: "0",
      display: "block",
      width: "0",
      height: "0",
      margin: "0",
      padding: "0",
      border: "0",
      "z-index": "2147483647",
      "pointer-events": "none",
      isolation: "isolate",
    };
    for (const [property, value] of Object.entries(declarations)) {
      element.style.setProperty(property, value, "important");
    }
  }

  function createTooltipManager(documentObject, initialLanguage, initialInteractive) {
    let language = initialLanguage === "de" ? "de" : "en";
    let interactive = initialInteractive !== false;
    let host = documentObject.getElementById(TOOLTIP_HOST_ID);
    if (host) host.remove();
    host = documentObject.createElement("div");
    host.id = TOOLTIP_HOST_ID;
    host.dataset.biasscannerUi = "true";
    protectTooltipHost(host);
    const shadow = host.attachShadow({ mode: "open" });
    const style = documentObject.createElement("style");
    style.textContent = `
      :host { color-scheme: light; }
      * { box-sizing: border-box; }
      #tooltip {
        pointer-events: auto;
        position: fixed;
        display: none;
        width: min(440px, calc(100vw - 24px));
        border: 1px solid #8a6a12;
        border-radius: 10px;
        padding: 12px 14px;
        background: #fffdf5;
        color: #20242a;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);
        font: 14px/1.45 Arial, sans-serif;
        text-align: left;
        overflow-wrap: anywhere;
        transition: border-color 160ms ease, border-width 160ms ease, box-shadow 160ms ease;
      }
      #tooltip.visible { display: block; }
      #tooltip.ready {
        border: 3px solid #d5a000;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.30), 0 0 0 2px rgba(255, 210, 60, 0.28);
      }
      #summary { margin: 0; }
      .type {
        appearance: none;
        border: 0;
        border-bottom: 1px dotted #765800;
        border-radius: 2px;
        padding: 0;
        background: transparent;
        color: #5e4500;
        font: inherit;
        cursor: help;
      }
      .type.primary { font-weight: 800; }
      .type:hover, .type:focus-visible {
        color: #201700;
        outline: 2px solid rgba(213, 160, 0, 0.55);
        outline-offset: 2px;
      }
      .strength { white-space: nowrap; }
      #definition {
        display: none;
        margin-top: 10px;
        border-top: 1px solid #dfd3ae;
        padding-top: 9px;
      }
      #definition.visible { display: block; }
      #definition-heading { margin: 0 0 4px; font-weight: 800; }
      #group {
        display: inline-block;
        margin-left: 6px;
        border: 0;
        border-radius: 999px;
        padding: 1px 7px;
        color: #fff;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        vertical-align: 1px;
        cursor: help;
      }
      #group:hover, #group:focus-visible { outline: 2px solid rgba(32, 36, 42, 0.45); outline-offset: 2px; }
      #definition-text { margin: 0; color: #3f4650; }
      #group-definition { margin: 8px 0 0; border-left: 3px solid #d5a000; padding-left: 8px; color: #3f4650; }
      #group-definition[hidden] { display: none; }
      #feedback {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 10px;
        border-top: 1px solid #dfd3ae;
        padding-top: 9px;
      }
      #feedback[hidden] { display: none; }
      #feedback-question { margin: 0 3px 0 0; color: #3f4650; font-size: 13px; }
      .feedback-choice {
        min-width: 44px;
        border: 1px solid #9aa4af;
        border-radius: 999px;
        padding: 3px 10px;
        background: #fff;
        color: #26313d;
        font: 700 12px/1.35 Arial, sans-serif;
        cursor: pointer;
      }
      .feedback-choice:hover, .feedback-choice:focus-visible {
        border-color: #436a8f;
        outline: 2px solid rgba(67, 106, 143, 0.24);
        outline-offset: 1px;
      }
      .feedback-choice.selected {
        border-color: #175f9e;
        background: #175f9e;
        color: #fff;
      }
      .feedback-reason {
        flex: 0 1 0;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transition: max-width 220ms ease, opacity 160ms ease, flex-basis 220ms ease;
      }
      .feedback-reason.visible { flex-basis: 190px; max-width: 230px; opacity: 1; }
      .feedback-reason input {
        width: 100%;
        min-width: 150px;
        border: 1px solid #9aa4af;
        border-radius: 6px;
        padding: 4px 7px;
        background: #fff;
        color: #20242a;
        font: 12px/1.35 Arial, sans-serif;
      }
      .feedback-reason input:focus { border-color: #175f9e; outline: 2px solid rgba(23, 95, 158, 0.22); }
    `;
    const tooltip = documentObject.createElement("aside");
    tooltip.id = "tooltip";
    tooltip.setAttribute("role", "tooltip");
    const summary = documentObject.createElement("p");
    summary.id = "summary";
    const definition = documentObject.createElement("section");
    definition.id = "definition";
    const definitionHeading = documentObject.createElement("p");
    definitionHeading.id = "definition-heading";
    const definitionName = documentObject.createElement("span");
    const group = documentObject.createElement("button");
    group.type = "button";
    group.id = "group";
    definitionHeading.append(definitionName, group);
    const definitionText = documentObject.createElement("p");
    definitionText.id = "definition-text";
    const groupDefinition = documentObject.createElement("p");
    groupDefinition.id = "group-definition";
    groupDefinition.hidden = true;
    definition.append(definitionHeading, definitionText, groupDefinition);
    const feedback = documentObject.createElement("section");
    feedback.id = "feedback";
    const feedbackQuestion = documentObject.createElement("p");
    feedbackQuestion.id = "feedback-question";
    const agreeButton = documentObject.createElement("button");
    agreeButton.type = "button";
    agreeButton.className = "feedback-choice";
    agreeButton.dataset.feedback = "agree";
    const disagreeButton = documentObject.createElement("button");
    disagreeButton.type = "button";
    disagreeButton.className = "feedback-choice";
    disagreeButton.dataset.feedback = "disagree";
    const feedbackReason = documentObject.createElement("span");
    feedbackReason.className = "feedback-reason";
    const feedbackReasonInput = documentObject.createElement("input");
    feedbackReasonInput.type = "text";
    feedbackReasonInput.maxLength = 500;
    feedbackReason.appendChild(feedbackReasonInput);
    feedback.append(feedbackQuestion, agreeButton, disagreeButton, feedbackReason);
    tooltip.append(summary, feedback, definition);
    shadow.append(style, tooltip);
    documentObject.documentElement.appendChild(host);

    let currentSource = null;
    let currentSentence = null;
    let readyTimer = null;
    let hideTimer = null;

    function clearTimers() {
      clearTimeout(readyTimer);
      clearTimeout(hideTimer);
      readyTimer = null;
      hideTimer = null;
    }

    function position() {
      if (!currentSource?.isConnected) return;
      const rect = currentSource.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = documentObject.defaultView?.innerWidth || 1024;
      const viewportHeight = documentObject.defaultView?.innerHeight || 768;
      const left = Math.max(12, Math.min(rect.left, viewportWidth - tooltipRect.width - 12));
      const above = rect.top - tooltipRect.height - 10;
      const top = above >= 8 ? above : Math.min(viewportHeight - tooltipRect.height - 8, rect.bottom + 10);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    }

    function showDefinition(typeName) {
      const entry = namespace.taxonomy?.lookup(typeName, language);
      if (!entry) {
        definition.classList.remove("visible");
        return;
      }
      definitionName.textContent = entry.name;
      group.textContent = entry.groupName;
      group.style.backgroundColor = entry.color;
      definitionText.textContent = entry.definition;
      groupDefinition.textContent = entry.groupDefinition || "";
      groupDefinition.hidden = true;
      definition.classList.add("visible");
    }

    function showGroupDefinition() {
      if (!groupDefinition.textContent) return;
      groupDefinition.hidden = false;
    }

    function hideGroupDefinition() {
      groupDefinition.hidden = true;
    }

    group.addEventListener("pointerenter", showGroupDefinition);
    group.addEventListener("pointerleave", hideGroupDefinition);
    group.addEventListener("focus", showGroupDefinition);
    group.addEventListener("blur", hideGroupDefinition);

    function renderFeedback(sentence) {
      const labels = feedbackCopy[language] || feedbackCopy.en;
      const storedFeedback = sentence?.user_feedback;
      const agreement = typeof storedFeedback === "string"
        ? storedFeedback
        : storedFeedback?.agreement || "";
      const explanation = typeof storedFeedback === "object"
        ? storedFeedback?.explanation || ""
        : "";
      feedback.hidden = !interactive || !tooltip.classList.contains("ready");
      feedbackQuestion.textContent = labels.question;
      agreeButton.textContent = labels.agree;
      disagreeButton.textContent = labels.disagree;
      feedbackReason.classList.toggle("visible", Boolean(agreement));
      feedbackReasonInput.placeholder = labels.why;
      feedbackReasonInput.setAttribute("aria-label", labels.why);
      if (feedbackReasonInput.value !== explanation) feedbackReasonInput.value = explanation;
      for (const button of [agreeButton, disagreeButton]) {
        const selected = agreement === button.dataset.feedback;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
    }

    function render(sentence) {
      summary.replaceChildren();
      definition.classList.remove("visible");
      const types = sentenceTypes(sentence);
      const primary = primaryType(sentence).toLocaleLowerCase();
      types.forEach((typeName, index) => {
        if (index) summary.append(documentObject.createTextNode(", "));
        const button = documentObject.createElement("button");
        button.type = "button";
        const isPrimary = primary && typeName.toLocaleLowerCase() === primary;
        button.className = `type${isPrimary ? " primary" : ""}`;
        button.textContent = namespace.taxonomy?.lookup(typeName, language)?.name || typeName;
        button.addEventListener("pointerenter", () => showDefinition(typeName));
        button.addEventListener("focus", () => showDefinition(typeName));
        summary.appendChild(button);
      });
      const strength = Number(sentence.bias_strength).toFixed(1);
      summary.append(documentObject.createTextNode(`, `));
      const strengthNode = documentObject.createElement("span");
      strengthNode.className = "strength";
      strengthNode.textContent = `(${strength})`;
      summary.append(strengthNode, documentObject.createTextNode(` — ${sentenceExplanation(sentence)}`));
      renderFeedback(sentence);
    }

    function recordFeedback(value) {
      if (!interactive || !currentSentence) return;
      const previous = typeof currentSentence.user_feedback === "object"
        ? currentSentence.user_feedback
        : {};
      currentSentence.user_feedback = {
        agreement: value,
        explanation: previous.explanation || "",
      };
      renderFeedback(currentSentence);
      feedbackReasonInput.focus();
    }

    agreeButton.addEventListener("click", () => recordFeedback("agree"));
    disagreeButton.addEventListener("click", () => recordFeedback("disagree"));
    feedbackReasonInput.addEventListener("input", () => {
      if (!currentSentence || typeof currentSentence.user_feedback !== "object") return;
      currentSentence.user_feedback.explanation = feedbackReasonInput.value;
    });

    function hide() {
      clearTimers();
      tooltip.classList.remove("visible", "ready");
      definition.classList.remove("visible");
      groupDefinition.hidden = true;
      currentSource = null;
      currentSentence = null;
    }

    function scheduleHide(delay) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, delay);
    }

    tooltip.addEventListener("pointerenter", () => clearTimeout(hideTimer));
    tooltip.addEventListener("pointerleave", () => scheduleHide(180));

    return {
      setLanguage(value) {
        language = value === "de" ? "de" : "en";
        if (currentSentence) render(currentSentence);
      },
      setInteractive(value) {
        interactive = value !== false;
        if (currentSentence) renderFeedback(currentSentence);
      },
      show(source, sentence) {
        clearTimeout(hideTimer);
        if (currentSentence === sentence && tooltip.classList.contains("visible")) {
          currentSource = source;
          position();
          return;
        }
        clearTimers();
        currentSource = source;
        currentSentence = sentence;
        tooltip.classList.remove("ready");
        render(sentence);
        tooltip.classList.add("visible");
        position();
        readyTimer = setTimeout(() => {
          tooltip.classList.add("ready");
          renderFeedback(currentSentence);
        }, READY_DELAY_MS);
      },
      leave(source) {
        if (source !== currentSource) return;
        scheduleHide(tooltip.classList.contains("ready") ? TRANSFER_DELAY_MS : 120);
      },
      hide,
      element: tooltip,
    };
  }

  function getTooltipManager(documentObject, language, interactive) {
    let manager = tooltipManagers.get(documentObject);
    if (!manager) {
      manager = createTooltipManager(documentObject, language, interactive);
      tooltipManagers.set(documentObject, manager);
    } else {
      manager.setLanguage(language);
      manager.setInteractive(interactive);
    }
    return manager;
  }

  function applyProtectedStyle(element, sentence) {
    const colors = highlightColors(sentence);
    const resolved = resolvedTaxonomy(sentence);
    const backgroundColor = colors[0] || "#ffd54f";
    const backgroundImage = colors.length > 1
      ? `linear-gradient(90deg, ${colors.join(", ")})`
      : `linear-gradient(${backgroundColor}, ${backgroundColor})`;
    const declarations = {
      "--biasscanner-highlight-color": backgroundColor,
      "--biasscanner-highlight-image": backgroundImage,
      "background-color": backgroundColor,
      "background-image": backgroundImage,
      "box-shadow": "inset 0 -0.18em 0 rgba(36, 30, 0, 0.22), 0 0 0 1px rgba(30, 30, 30, 0.30)",
      color: "#111",
      border: "0",
      "border-radius": "0.14em",
      margin: "0",
      padding: "0",
      "text-decoration": "none",
      "text-shadow": "none",
      cursor: "help",
    };
    for (const [property, value] of Object.entries(declarations)) {
      element.style.setProperty(property, value, "important");
    }
    element.dataset.biasscannerPrimaryType = primaryType(sentence);
    element.dataset.biasscannerResolvedTypes = resolved
      .map((entry) => entry.canonicalName)
      .join(", ");
    element.dataset.biasscannerGroups = [...new Set(resolved.map((entry) => entry.group))].join(", ");
  }

  function decorateWrapper(wrapper, sentence, match, tooltipManager) {
    wrapper.dataset.biasscannerHighlight = "true";
    wrapper.dataset.biasscannerMatchStrategy = match.strategy;
    wrapper.dataset.biasscannerMatchScore = match.score.toFixed(3);
    wrapper.tabIndex = 0;
    applyProtectedStyle(wrapper, sentence);
    wrapper.addEventListener("pointerenter", () => tooltipManager.show(wrapper, sentence));
    wrapper.addEventListener("pointerleave", () => tooltipManager.leave(wrapper));
    wrapper.addEventListener("focus", () => tooltipManager.show(wrapper, sentence));
    wrapper.addEventListener("blur", () => tooltipManager.leave(wrapper));
  }

  function wrapSegment(segment, sentence, match, documentObject, tooltipManager) {
    if (!segment.node.isConnected || segment.node.parentElement?.closest(HIGHLIGHT_SELECTOR)) return null;
    if (segment.endOffset > segment.node.nodeValue.length) return null;

    const range = documentObject.createRange();
    range.setStart(segment.node, segment.startOffset);
    range.setEnd(segment.node, segment.endOffset);
    const wrapper = documentObject.createElement("span");
    decorateWrapper(wrapper, sentence, match, tooltipManager);
    range.surroundContents(wrapper);
    return wrapper;
  }

  const BLOCK_SELECTOR = [
    "address", "article", "aside", "blockquote", "div", "figcaption", "figure", "footer",
    "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "li", "main", "nav",
    "ol", "p", "pre", "section", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
  ].join(",");

  const UNSAFE_INLINE_SELECTOR = [
    "button", "canvas", "iframe", "input", "object", "select", "svg", "textarea", "video",
  ].join(",");

  function nearestBlock(node) {
    return node.parentElement?.closest(BLOCK_SELECTOR) || null;
  }

  function wrapCombinedRecord(record, documentObject, tooltipManager) {
    if (record.segments.length < 2) return null;
    const first = record.segments[0];
    const last = record.segments.at(-1);
    if (!first.node.isConnected || !last.node.isConnected) return null;

    const block = nearestBlock(first.node);
    if (!block || nearestBlock(last.node) !== block) return null;
    if (record.segments.some((segment) => nearestBlock(segment.node) !== block)) return null;

    const range = documentObject.createRange();
    range.setStart(first.node, first.startOffset);
    range.setEnd(last.node, last.endOffset);
    const preview = range.cloneContents();
    if (preview.querySelector(BLOCK_SELECTOR) || preview.querySelector(UNSAFE_INLINE_SELECTOR)) return null;

    const wrapper = documentObject.createElement("span");
    wrapper.dataset.biasscannerCombined = "true";
    decorateWrapper(wrapper, record.sentence, record.match, tooltipManager);
    try {
      range.surroundContents(wrapper);
      return wrapper;
    } catch {
      return null;
    }
  }

  function compareRecordsFromEnd(left, right) {
    const leftStart = left.segments[0];
    const rightStart = right.segments[0];
    if (leftStart.node === rightStart.node) return rightStart.startOffset - leftStart.startOffset;
    const relation = leftStart.node.compareDocumentPosition(rightStart.node);
    if (relation & globalThis.Node.DOCUMENT_POSITION_FOLLOWING) return 1;
    if (relation & globalThis.Node.DOCUMENT_POSITION_PRECEDING) return -1;
    return 0;
  }

  function highlightSentences(
    sentences,
    root = document.body,
    { language = "en", interactive = true } = {},
  ) {
    clearHighlights(root.ownerDocument || document);
    const documentObject = root.ownerDocument || document;
    const tooltipManager = getTooltipManager(documentObject, language, interactive);
    tooltipManager.hide();
    const matched = [];
    let remaining = [...sentences];
    const usedDomSegments = new WeakMap();
    let indexedLength = 0;

    function segmentsOverlapUsed(segments) {
      return segments.some((segment) => (usedDomSegments.get(segment.node) || []).some(
        (used) => segment.startOffset < used.endOffset && used.startOffset < segment.endOffset,
      ));
    }

    function rememberSegments(segments) {
      for (const segment of segments) {
        const used = usedDomSegments.get(segment.node) || [];
        used.push({ startOffset: segment.startOffset, endOffset: segment.endOffset });
        usedDomSegments.set(segment.node, used);
      }
    }

    const distinctRoots = root === documentObject.body ? [root] : [root, documentObject.body];
    const searchPasses = [
      ...distinctRoots.map((searchRoot) => ({ searchRoot, includeCssHidden: false })),
      ...distinctRoots.map((searchRoot) => ({ searchRoot, includeCssHidden: true })),
    ];
    for (const { searchRoot, includeCssHidden } of searchPasses) {
      if (!remaining.length) break;
      const index = namespace.textMatcher.buildTextIndex(searchRoot, { includeCssHidden });
      indexedLength = Math.max(indexedLength, index.text.length);
      if (!index.text) continue;
      const excludedRanges = [];
      const nextRemaining = [];

      for (const sentence of remaining) {
        let match = null;
        let segments = [];
        for (let attempt = 0; attempt < 5; attempt += 1) {
          match = namespace.textMatcher.findBestMatch(index, sentence.text, excludedRanges);
          if (!match) break;
          segments = namespace.textMatcher.domSegmentsForMatch(index, match);
          if (segments.length && !segmentsOverlapUsed(segments)) break;
          excludedRanges.push({ start: match.start, end: match.end });
          match = null;
          segments = [];
        }

        if (!match || !segments.length) {
          nextRemaining.push(sentence);
          continue;
        }
        excludedRanges.push({ start: match.start, end: match.end });
        rememberSegments(segments);
        const record = { sentence, match, segments, elementCount: 0 };
        matched.push(record);
      }
      remaining = nextRemaining;
    }

    for (const record of [...matched].sort(compareRecordsFromEnd)) {
      const combined = wrapCombinedRecord(record, documentObject, tooltipManager);
      if (combined) {
        record.elementCount = 1;
        continue;
      }
      for (const segment of [...record.segments].reverse()) {
        const element = wrapSegment(
          segment,
          record.sentence,
          record.match,
          documentObject,
          tooltipManager,
        );
        if (element) record.elementCount += 1;
      }
    }

    return {
      matched: matched
        .filter((record) => record.elementCount > 0)
        .sort((left, right) => left.sentence.originalIndex - right.sentence.originalIndex),
      unmatched: [
        ...remaining,
        ...matched.filter((record) => record.elementCount === 0).map((record) => record.sentence),
      ],
      indexedLength,
    };
  }

  namespace.highlighter = { clearHighlights, highlightSentences };
})();


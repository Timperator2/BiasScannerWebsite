(() => {
  "use strict";

  const namespace = (globalThis.__BIASSCANNER__ ||= {});
  const API_ENDPOINT = "https://app.biasscanner.org:8080";
  const REQUEST_TIMEOUT_MS = 90_000;
  const copy = {
    en: {
      empty: "Please enter an article first.",
      request: "BiasScanner could not reach the analysis service.",
      response: "BiasScanner received invalid analysis responses twice. Please try again.",
      ready: "Analysis complete. Open the BiasScanner report below.",
      analyzing: "Analyzing article…",
    },
    de: {
      empty: "Bitte gib zuerst einen Artikel ein.",
      request: "BiasScanner konnte den Analysedienst nicht erreichen.",
      response: "BiasScanner hat zweimal eine ungültige Analyseantwort erhalten. Bitte versuche es erneut.",
      ready: "Analyse abgeschlossen. Öffne unten den BiasScanner-Bericht.",
      analyzing: "Artikel wird analysiert…",
    },
  };

  const state = {
    analysis: null,
    articleText: "",
    records: [],
    statistics: null,
    overallFeedback: {},
    requestSequence: 0,
  };

  const elements = {};

  function language() {
    return elements.language.value === "de" ? "de" : "en";
  }

  function displayType(canonicalName, selectedLanguage) {
    return namespace.taxonomy?.lookup(canonicalName, selectedLanguage)?.name || canonicalName;
  }

  function countSentences(text, selectedLanguage) {
    if (globalThis.Intl?.Segmenter) {
      const segmenter = new Intl.Segmenter(selectedLanguage, { granularity: "sentence" });
      return [...segmenter.segment(text)].filter((segment) => segment.segment.trim()).length;
    }
    return text.split(/[.!?]+(?:\s+|$)|\n+/u).filter((part) => part.trim()).length;
  }

  function computeStatistics(articleText, records, selectedLanguage) {
    const articleSentenceCount = Math.max(1, countSentences(articleText, selectedLanguage));
    const markedSentenceCount = records.reduce(
      (sum, record) => sum + Math.max(1, countSentences(record.sentence.text, selectedLanguage)),
      0,
    );
    const frequencies = new Map();
    let strengthTotal = 0;
    for (const { sentence } of records) {
      strengthTotal += sentence.bias_strength;
      for (const type of sentence.bias_types) {
        frequencies.set(type, (frequencies.get(type) || 0) + 1);
      }
    }
    const average = records.length ? strengthTotal / records.length : 0;
    const percentage = Math.min(100, Math.round((markedSentenceCount / articleSentenceCount) * 100));
    const mostFrequentEntry = [...frequencies.entries()].sort((left, right) => right[1] - left[1])[0];
    return {
      percentage,
      average,
      rating: (percentage / 100 + average) / 2,
      mostFrequent: mostFrequentEntry
        ? `${displayType(mostFrequentEntry[0], selectedLanguage)} (${mostFrequentEntry[1]})`
        : "",
      mostFrequentType: mostFrequentEntry?.[0] || "",
      mostFrequentCount: mostFrequentEntry?.[1] || 0,
    };
  }

  function feedbackLines(feedback, selectedLanguage) {
    if (!feedback?.agreement) return [];
    const labels = selectedLanguage === "de"
      ? ["Nutzerfeedback", "Zustimmung", "Ablehnung", "Begründung"]
      : ["User feedback", "Agree", "Disagree", "Reason"];
    return [
      `${labels[0]}: ${feedback.agreement === "agree" ? labels[1] : labels[2]}`,
      ...(feedback.explanation ? [`${labels[3]}: ${feedback.explanation}`] : []),
    ];
  }

  function donationText(conclusion, records, statistics, selectedLanguage) {
    const lines = records.map(({ sentence }, index) => [
      `${index + 1}. ${sentence.text}`,
      `${sentence.bias_types.map((type) => displayType(type, selectedLanguage)).join(", ")}: ${sentence.bias_strength.toFixed(1)}`,
      sentence.bias_explanation,
      ...feedbackLines(sentence.user_feedback, selectedLanguage),
    ].join("\n"));
    const labels = selectedLanguage === "de"
      ? ["Anteil", "Durchschnitt", "Gesamtbewertung", "Feedback zur Gesamtbewertung"]
      : ["Percentage", "Average", "Overall rating", "Overall-rating feedback"];
    return [
      ...lines,
      conclusion,
      `${labels[0]}: ${statistics.percentage}%`,
      `${labels[1]}: ${statistics.average.toFixed(2)}`,
      `${labels[2]}: ${statistics.rating.toFixed(2)}`,
      ...(state.overallFeedback.agreement ? [
        `${labels[3]}: ${state.overallFeedback.agreement}`,
        ...feedbackLines(state.overallFeedback, selectedLanguage).slice(1),
      ] : []),
    ].filter(Boolean).join("\n\n");
  }

  function structuredFeedback(records) {
    return {
      sentences: records.map(({ sentence }) => ({
        text: sentence.text,
        user_feedback: sentence.user_feedback?.agreement ? {
          agreement: sentence.user_feedback.agreement,
          explanation: sentence.user_feedback.explanation || "",
        } : null,
      })),
      overall_bias: {
        user_feedback: state.overallFeedback.agreement ? {
          agreement: state.overallFeedback.agreement,
          explanation: state.overallFeedback.explanation || "",
        } : null,
      },
    };
  }

  async function post(payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`Middleman returned HTTP ${response.status}.`);
      return body;
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("The BiasScanner request timed out.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function donate() {
    const selectedLanguage = language();
    await post({
      type: "donation",
      text: donationText(
        state.analysis?.conclusion || "",
        state.records,
        state.statistics,
        selectedLanguage,
      ),
      url: window.location.href,
      language: selectedLanguage,
      feedback: structuredFeedback(state.records),
    });
  }

  function render() {
    if (!state.analysis) return;
    const selectedLanguage = language();
    const threshold = Number(elements.strength.value) || 0.1;
    const visible = state.analysis.sentences.filter((sentence) => sentence.bias_strength >= threshold);
    const highlights = namespace.highlighter.highlightSentences(visible, elements.article, {
      language: selectedLanguage,
      interactive: true,
    });
    state.records = highlights.matched;
    state.statistics = computeStatistics(state.articleText, state.records, selectedLanguage);
    namespace.reportUi.showResults({
      language: selectedLanguage,
      conclusion: state.analysis.conclusion,
      records: state.records,
      statistics: state.statistics,
      overallFeedback: state.overallFeedback,
      onDonate: donate,
    });
  }

  function reset() {
    state.requestSequence += 1;
    state.analysis = null;
    state.articleText = "";
    state.records = [];
    state.statistics = null;
    state.overallFeedback = {};
    namespace.highlighter.clearHighlights(document);
    document.getElementById("biasscanner-extension-root")?.remove();
    elements.article.replaceChildren();
    elements.article.hidden = true;
    elements.input.hidden = false;
    elements.detect.disabled = false;
    elements.reset.disabled = true;
    elements.status.textContent = "";
    elements.input.focus();
  }

  async function analyze() {
    const articleText = elements.input.value.trim();
    const selectedLanguage = language();
    const labels = copy[selectedLanguage];
    if (!articleText) {
      elements.status.textContent = labels.empty;
      elements.input.focus();
      return;
    }

    const sequence = ++state.requestSequence;
    state.articleText = articleText;
    state.overallFeedback = {};
    elements.article.textContent = articleText;
    elements.article.hidden = false;
    elements.input.hidden = true;
    elements.detect.disabled = true;
    elements.reset.disabled = true;
    elements.status.textContent = labels.analyzing;
    namespace.reportUi.showLoading(selectedLanguage);

    try {
      state.analysis = await namespace.analysisResponse.requestWithSingleRetry(
        async () => ({
          body: await post({ type: "prompt", text: articleText, language: selectedLanguage }),
        }),
        articleText,
        {
          shouldContinue: () => sequence === state.requestSequence,
          onInvalid: (error, attempt) => console.warn(
            `BiasScanner demo rejected analysis response (attempt ${attempt}/2)`,
            error,
          ),
        },
      );
      if (sequence !== state.requestSequence || !state.analysis) return;
      render();
      elements.status.textContent = labels.ready;
      elements.reset.disabled = false;
    } catch (error) {
      if (sequence !== state.requestSequence) return;
      const invalid = error?.name === "InvalidAnalysisError";
      const message = invalid ? labels.response : `${labels.request} ${error?.message || ""}`.trim();
      namespace.reportUi.showError(selectedLanguage, message);
      elements.status.textContent = message;
      elements.input.hidden = false;
      elements.article.hidden = true;
      elements.detect.disabled = false;
      elements.reset.disabled = true;
    }
  }

  function initialize() {
    Object.assign(elements, {
      language: document.getElementById("language-text"),
      model: document.getElementById("model-select"),
      strength: document.getElementById("sensitivity-slider"),
      strengthValue: document.getElementById("slider-value"),
      detect: document.getElementById("detect-bias"),
      reset: document.getElementById("reset-text"),
      input: document.getElementById("demo-text"),
      article: document.getElementById("sent-text"),
      status: document.getElementById("demo-status"),
    });

    const siteLanguage = document.getElementById("language-site");
    if (["en", "de"].includes(siteLanguage?.value)) {
      elements.language.value = siteLanguage.value;
    }

    elements.detect.addEventListener("click", analyze);
    elements.reset.addEventListener("click", reset);
    elements.strength.addEventListener("input", () => {
      elements.strengthValue.value = Number(elements.strength.value).toFixed(1);
      if (state.analysis) render();
    });
    elements.language.addEventListener("change", () => {
      if (state.analysis) reset();
    });
    siteLanguage?.addEventListener("change", () => {
      if (!state.analysis && ["en", "de"].includes(siteLanguage.value)) {
        elements.language.value = siteLanguage.value;
      }
    });
    elements.strengthValue.value = Number(elements.strength.value).toFixed(1);
    elements.article.hidden = true;
  }

  document.addEventListener("DOMContentLoaded", initialize);
  namespace.websiteDemo = { computeStatistics, donationText, render, reset };
})();

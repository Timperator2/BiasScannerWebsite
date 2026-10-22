(() => {
  "use strict";

  const namespace = (globalThis.__BIASSCANNER__ ||= {});
  if (namespace.reportUi) return;

  const HOST_ID = "biasscanner-extension-root";
  const copy = {
    en: {
      loading: "Looking for bias",
      show: "Show BiasScanner report",
      hide: "Hide BiasScanner report",
      title: "BiasScanner report",
      noMatches: "No passages that our model considers biased were found on this page.",
      percentage: "Percentage of biased sentences",
      frequent: "Most frequent bias",
      average: "Average bias strength",
      rating: "Overall bias rating",
      colorLegend: "Bias type color legend",
      colorLegendAlt: "Bias type periodic table",
      feedbackQuestion: "Do you agree with this assessment?",
      agree: "Yes",
      disagree: "No",
      why: "Why?",
      sortStrength: "Sort by bias strength",
      sortOccurrence: "Sort by occurrence",
      share: "Anonymously share this analysis for research",
      sharing: "Sharing…",
      shared: "Thank you. The analysis was shared.",
      shareFailed: "The analysis could not be shared.",
      sharePromptTitle: "Share this analysis anonymously?",
      sharePromptBody: "The displayed analysis, your optional feedback, and the current page URL will be sent to BiasScanner for research. Your IP address is not stored in plain text, but converted into a user ID that cannot be directly assigned to a person. This allows you to help us improve BiasScanner and gain general insights into media use, bias, and propaganda, while your personal media use remains private.",
      confirmShare: "Share analysis",
      cancel: "Cancel",
      thanksTitle: "Thank you!",
      rewardContribution: "Research contribution",
      rewardContributionBadge: "+1 research contribution",
      rewardStamp: "Research stamp",
      rewardStampText: "Contributed to research",
      rewardProgress: "Progress ring",
      rewardProgressText: "Contribution submitted",
      rewardMosaic: "Research mosaic",
      rewardMosaicText: "One more piece of insight",
      rewardArchive: "Research archive",
      rewardArchiveText: "Analysis added to research",
      learnMore: "Want to learn more about bias and propaganda?",
      close: "Close",
    },
    de: {
      loading: "Suche nach Bias",
      show: "BiasScanner-Bericht anzeigen",
      hide: "BiasScanner-Bericht ausblenden",
      title: "BiasScanner-Bericht",
      noMatches: "Auf dieser Seite wurden keine Textstellen gefunden, die unser Modell als voreingenommen einstuft.",
      percentage: "Anteil voreingenommener Sätze",
      frequent: "Häufigste Form der Voreingenommenheit",
      average: "Durchschnittliche Stärke der Voreingenommenheit",
      rating: "Gesamtbewertung der Voreingenommenheit",
      colorLegend: "Legende der Bias-Typfarben",
      colorLegendAlt: "Periodensystem der Bias-Typen",
      feedbackQuestion: "Stimmst du dieser Bewertung zu?",
      agree: "Ja",
      disagree: "Nein",
      why: "Wieso?",
      sortStrength: "Nach Bias-Stärke sortieren",
      sortOccurrence: "Nach Vorkommen sortieren",
      share: "Diese Analyse anonym für Forschungszwecke teilen",
      sharing: "Wird geteilt…",
      shared: "Danke. Die Analyse wurde geteilt.",
      shareFailed: "Die Analyse konnte nicht geteilt werden.",
      sharePromptTitle: "Diese Analyse anonym teilen?",
      sharePromptBody: "Die angezeigte Analyse, dein optionales Feedback und die URL der aktuellen Seite werden zu Forschungszwecken an BiasScanner gesendet. Deine IP-Adresse wird nicht im Klartext gespeichert, sondern in eine nicht direkt einer Person zuordenbare User-ID umgewandelt. So kannst du uns helfen, BiasScanner zu verbessern und allgemeine Erkenntnisse über Mediennutzung, Bias und Propaganda zu sammeln, während deine persönliche Mediennutzung gleichzeitig deine Privatsache bleibt.",
      confirmShare: "Analyse teilen",
      cancel: "Abbrechen",
      thanksTitle: "Vielen Dank!",
      rewardContribution: "Forschungsbeitrag",
      rewardContributionBadge: "+1 Forschungsbeitrag",
      rewardStamp: "Forschungsstempel",
      rewardStampText: "Zur Forschung beigetragen",
      rewardProgress: "Fortschrittsring",
      rewardProgressText: "Beitrag übermittelt",
      rewardMosaic: "Forschungsmosaik",
      rewardMosaicText: "Ein weiterer Erkenntnisbaustein",
      rewardArchive: "Forschungsarchiv",
      rewardArchiveText: "Analyse zur Forschung hinzugefügt",
      learnMore: "Möchtest du mehr über unfaire Berichterstattung und Propaganda erfahren?",
      close: "Schließen",
    },
  };

  const assessmentCopy = {
    en: {
      percentage: [
        { max: 0, tone: "low", text: "The article contains no sentences that our model considers biased." },
        { max: 20, tone: "low", text: "The article contains a few sentences that our model considers biased, but most of the reporting appears fair." },
        { max: 50, tone: "medium", text: "The article contains a substantial number of sentences that our model considers biased, although it also contains fair passages." },
        { max: 70, tone: "high", text: "Our model considers most of the sentences in the article biased; fair reporting is the exception rather than the norm." },
        { max: 100, tone: "high", text: "Our model considers almost the entire article biased—that is quite a feat." },
      ],
      average: [
        { max: 0, tone: "low", text: "The article contains no sentences that our model considers biased." },
        { max: 40, tone: "low", text: "The sentences our model identifies as biased are only mildly biased. It could be much worse." },
        { max: 70, tone: "medium", text: "The sentences our model identifies as biased are moderately biased, though some nuance remains." },
        { max: 100, tone: "high", text: "According to our model, when bias appears in this article, it is quite pronounced." },
      ],
      rating: [
        { max: 0, tone: "low", text: "Unbiased reporting (at least as far as our model can tell): The article contains no sentences that our model considers biased." },
        { max: 40, tone: "low", text: "Subtle bias: Our model considers the article mostly fair, with isolated examples of bias." },
        { max: 70, tone: "medium", text: "Clear bias: Our model considers the article to favor a narrative over impartial reporting, seeking to influence opinion rather than help readers form their own." },
        { max: 100, tone: "high", text: "Overt propaganda: According to our model, subtlety is not this article’s strong suit: it openly seeks to agitate rather than inform." },
      ],
    },
    de: {
      percentage: [
        { max: 0, tone: "low", text: "Der Artikel enthält keine Sätze, die unser Modell als voreingenommen einstuft." },
        { max: 20, tone: "low", text: "Der Artikel enthält einige Sätze, die unser Modell als voreingenommen einstuft; der Großteil der Berichterstattung wirkt jedoch ausgewogen." },
        { max: 50, tone: "medium", text: "Der Artikel enthält eine beträchtliche Zahl an Sätzen, die unser Modell als voreingenommen einstuft, weist aber auch ausgewogene Passagen auf." },
        { max: 70, tone: "high", text: "Unser Modell stuft die meisten Sätze des Artikels als voreingenommen ein; ausgewogene Berichterstattung ist eher die Ausnahme als die Regel." },
        { max: 100, tone: "high", text: "Unser Modell stuft nahezu den gesamten Artikel als voreingenommen ein – das ist eine beachtliche Leistung." },
      ],
      average: [
        { max: 0, tone: "low", text: "Der Artikel enthält keine Sätze, die unser Modell als voreingenommen einstuft." },
        { max: 40, tone: "low", text: "Die Sätze, die unser Modell als voreingenommen einstuft, sind ihm zufolge nur leicht voreingenommen. Es könnte deutlich schlimmer sein." },
        { max: 70, tone: "medium", text: "Die Sätze, die unser Modell als voreingenommen einstuft, sind ihm zufolge mäßig voreingenommen, weisen aber noch eine gewisse Nuanciertheit auf." },
        { max: 100, tone: "high", text: "Wenn unser Modell in diesem Artikel Voreingenommenheit erkennt, fällt diese ihm zufolge ziemlich stark aus." },
      ],
      rating: [
        { max: 0, tone: "low", text: "Unvoreingenommene Berichterstattung (zumindest soweit unser Modell das beurteilen kann): Der Artikel enthält keine Sätze, die unser Modell als voreingenommen einstuft." },
        { max: 40, tone: "low", text: "Subtile Voreingenommenheit: Unser Modell stuft den Artikel überwiegend als ausgewogen ein; vereinzelt finden sich jedoch Beispiele für Voreingenommenheit." },
        { max: 70, tone: "medium", text: "Deutliche Voreingenommenheit: Unser Modell sieht im Artikel eine klare Bevorzugung eines Narrativs gegenüber unvoreingenommener Berichterstattung. Er scheint eher darauf abzuzielen, Meinungen zu beeinflussen, als bei ihrer eigenständigen Bildung zu helfen." },
        { max: 100, tone: "high", text: "Offene Propaganda: Laut unserem Modell gehört Subtilität nicht zu den Stärken dieses Artikels: Er zielt offen darauf ab, zu agitieren, statt zu informieren." },
      ],
    },
  };

  function assessmentFor(metric, value, language) {
    const score = Math.min(100, Math.max(0, Number(value) || 0));
    const localized = assessmentCopy[language] || assessmentCopy.en;
    return localized[metric].find((entry) => score <= entry.max)
      || localized[metric][localized[metric].length - 1];
  }

  let host;
  let shadow;
  let barButton;
  let panel;
  let content;
  let panelOpen = false;
  let loadingInterval = null;

  function stopLoadingAnimation() {
    if (loadingInterval !== null) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }

  function startLoadingAnimation(label) {
    stopLoadingAnimation();
    const frames = ["", " .", " ..", " ..."];
    let frame = 0;
    const renderFrame = () => {
      barButton.textContent = `${label}${frames[frame % frames.length]}`;
      frame += 1;
    };
    renderFrame();
    loadingInterval = setInterval(renderFrame, 450);
  }

  function protectHost(element) {
    const declarations = {
      all: "initial",
      position: "fixed",
      inset: "auto 0 0 0",
      display: "block",
      width: "100%",
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

  function ensureMounted() {
    host = document.getElementById(HOST_ID);
    if (host?.shadowRoot) {
      shadow = host.shadowRoot;
      barButton = shadow.querySelector("#bar");
      panel = shadow.querySelector("#panel");
      content = shadow.querySelector("#content");
      return;
    }

    host = document.createElement("div");
    host.id = HOST_ID;
    host.dataset.biasscannerUi = "true";
    protectHost(host);
    shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
        :host { color-scheme: light; }
        * { box-sizing: border-box; }
        #bar {
          pointer-events: auto;
          position: fixed;
          left: 50%;
          bottom: 10px;
          transform: translateX(-50%);
          width: min(720px, calc(100vw - 24px));
          border: 1px solid #657080;
          border-radius: 10px;
          padding: 11px 18px;
          background: #fff;
          color: #1c2530;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.24);
          font: 700 15px/1.25 Arial, sans-serif;
          text-align: center;
          cursor: pointer;
        }
        #bar[data-kind="loading"] { cursor: progress; }
        #bar[data-kind="error"] { border-color: #b42318; color: #8a1c14; }
        #panel {
          pointer-events: auto;
          position: fixed;
          left: 50%;
          bottom: 62px;
          transform: translateX(-50%);
          display: none;
          width: min(900px, calc(100vw - 24px));
          max-height: min(78vh, 760px);
          overflow: auto;
          border: 1px solid #657080;
          border-radius: 12px;
          padding: 18px;
          background: #fff;
          color: #1c2530;
          box-shadow: 0 12px 42px rgba(0, 0, 0, 0.32);
          font: 14px/1.55 Arial, sans-serif;
        }
        #panel.open { display: block; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        h2 { margin: 0; font-size: 20px; }
        h3 { margin: 20px 0 8px; font-size: 16px; }
        button {
          border: 0;
          border-radius: 6px;
          padding: 8px 12px;
          background: #277a3d;
          color: #fff;
          font: 700 13px/1.25 Arial, sans-serif;
          cursor: pointer;
        }
        button.secondary { background: #4d5968; }
        button:disabled { opacity: 0.6; cursor: wait; }
        #actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0; }
        #summary { margin: 12px 0 0; white-space: pre-wrap; }
        #statistics { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 9px; margin: 16px 0; }
        .stat { border: 1px solid #cbd3dc; border-radius: 8px; padding: 10px 12px; background: #eef2f5; }
        .stat.low { border-color: #2e7d32; border-left-width: 5px; background: #edf7ef; }
        .stat.medium { border-color: #c77700; border-left-width: 5px; background: #fff5e6; }
        .stat.high { border-color: #b42318; border-left-width: 5px; background: #fceceb; }
        .stat.taxonomy { border-left-width: 5px; }
        .stat-value { line-height: 1.35; }
        .stat-assessment { margin: 7px 0 0; color: #303842; font-size: 12px; line-height: 1.4; }
        .stat-definition { margin: 7px 0 0; color: #46515e; font-size: 12px; line-height: 1.4; }
        #color-legend { margin: 12px 0 16px; border: 1px solid #cbd3dc; border-radius: 8px; padding: 8px 10px; background: #f8fafb; }
        #color-legend summary { cursor: pointer; font-weight: 800; }
        .legend-image-link { display: block; margin-top: 10px; border-radius: 6px; overflow: hidden; }
        .legend-image { display: block; width: 100%; height: auto; }
        .rating-feedback { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 10px; border-top: 1px solid rgba(35, 45, 55, 0.18); padding-top: 9px; }
        .rating-feedback-question { margin-right: 3px; color: #303842; font-size: 12px; }
        .rating-feedback button { min-width: 44px; border: 1px solid #8b96a3; border-radius: 999px; padding: 3px 10px; background: #fff; color: #26313d; font-size: 12px; }
        .rating-feedback button.selected { border-color: #175f9e; background: #175f9e; color: #fff; }
        .rating-feedback-reason { flex: 0 1 0; max-width: 0; opacity: 0; overflow: hidden; transition: max-width 220ms ease, opacity 160ms ease, flex-basis 220ms ease; }
        .rating-feedback-reason.visible { flex-basis: 190px; max-width: 240px; opacity: 1; }
        .rating-feedback-reason input { width: 100%; min-width: 150px; border: 1px solid #8b96a3; border-radius: 6px; padding: 4px 7px; background: #fff; color: #20242a; font: 12px/1.35 Arial, sans-serif; }
        .sentence { margin: 12px 0; border-left: 4px solid #f2b400; padding: 10px 12px; background: #fff9df; }
        .sentence > strong { display: block; margin-bottom: 5px; }
        .sentence p { margin: 5px 0 0; }
        .meta { color: #53606e; font-size: 12px; }
        .meta .primary-type { color: #2f3742; font-weight: 800; }
        .meta .bias-type { cursor: help; text-decoration: underline dotted; text-underline-offset: 2px; }
        #knowledge-link { margin: 12px 0 16px; }
        #knowledge-link a { color: #175f9e; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
        #notice { min-height: 1.4em; margin: 10px 0 0; color: #435060; }
        #notice:empty { display: none; }
        #share-dialog-backdrop {
          pointer-events: auto;
          position: fixed;
          inset: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 32, 0.56);
        }
        #share-dialog {
          width: min(460px, 100%);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          border: 1px solid #657080;
          border-radius: 12px;
          padding: 20px;
          background: #fff;
          color: #1c2530;
          box-shadow: 0 18px 56px rgba(0, 0, 0, 0.36);
          font: 14px/1.55 Arial, sans-serif;
        }
        #share-dialog h3 { margin: 0 0 8px; font-size: 19px; }
        #share-dialog p { margin: 0; }
        .reward-sequence {
          position: relative;
          min-height: 178px;
          margin: 0 0 14px;
          overflow: hidden;
          border: 1px solid #e2d59a;
          border-radius: 12px;
          background: linear-gradient(145deg, #fffdf5, #f7f9fb);
        }
        .reward-scene {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px;
          opacity: 0;
          pointer-events: none;
          animation: biasscanner-reward-scene 2.2s var(--reward-delay) both;
        }
        .reward-scene:last-child { animation-name: biasscanner-reward-scene-final; }
        .reward-scene h4 { margin: 0; color: #596370; font-size: 11px; letter-spacing: .04em; text-transform: uppercase; }
        .reward-caption { margin: 0; color: #27313d; font-size: 13px; font-weight: 800; text-align: center; }
        @keyframes biasscanner-reward-scene {
          0%, 8% { opacity: 0; transform: translateY(7px); }
          18%, 80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-5px); }
        }
        @keyframes biasscanner-reward-scene-final {
          0%, 8% { opacity: 0; transform: translateY(7px); }
          18%, 100% { opacity: 1; transform: translateY(0); }
        }
        .reward-flow { position: relative; width: 220px; height: 78px; }
        .reward-core {
          position: absolute;
          left: 84px;
          top: 4px;
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          border: 2px solid #b38b00;
          border-radius: 50%;
          background: #fff9df;
          color: #277a3d;
          font-size: 25px;
          font-weight: 900;
          animation: biasscanner-reward-core 650ms calc(var(--reward-delay) + 650ms) both;
        }
        .reward-dot {
          position: absolute;
          left: var(--dot-left);
          top: 58px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--dot-color);
          animation: biasscanner-reward-dot 720ms calc(var(--reward-delay) + var(--dot-wait)) ease-in both;
        }
        @keyframes biasscanner-reward-dot {
          to { opacity: .15; transform: translate(var(--dot-x), -32px) scale(.35); }
        }
        @keyframes biasscanner-reward-core {
          0% { opacity: 0; transform: scale(.72); }
          70% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .reward-badge {
          position: absolute;
          right: 8px;
          top: 0;
          border-radius: 999px;
          padding: 4px 8px;
          background: #277a3d;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
          animation: biasscanner-reward-badge 500ms calc(var(--reward-delay) + 1.15s) both;
        }
        @keyframes biasscanner-reward-badge {
          from { opacity: 0; transform: translateY(8px) scale(.75); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .reward-stamp-visual {
          border: 4px double #a56d00;
          border-radius: 8px;
          padding: 12px 18px;
          color: #7e5700;
          background: #fffaf0;
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          transform: rotate(-4deg);
          animation: biasscanner-reward-stamp 620ms calc(var(--reward-delay) + 330ms) cubic-bezier(.2,.9,.3,1.25) both;
        }
        @keyframes biasscanner-reward-stamp {
          from { opacity: 0; transform: translateY(-24px) rotate(-8deg) scale(1.35); }
          to { opacity: 1; transform: translateY(0) rotate(-4deg) scale(1); }
        }
        .reward-progress-visual { position: relative; width: 74px; height: 74px; }
        .reward-progress-visual svg { display: block; width: 100%; height: 100%; transform: rotate(-90deg); }
        .reward-progress-track, .reward-progress-value { fill: none; stroke-width: 6; }
        .reward-progress-track { stroke: #e3e7eb; }
        .reward-progress-value {
          stroke: #277a3d;
          stroke-linecap: round;
          stroke-dasharray: 176;
          stroke-dashoffset: 176;
          animation: biasscanner-reward-progress 1s calc(var(--reward-delay) + 300ms) ease-out forwards;
        }
        .reward-progress-check { position: absolute; inset: 22px 0 0; color: #277a3d; font-size: 25px; font-weight: 900; text-align: center; }
        @keyframes biasscanner-reward-progress { to { stroke-dashoffset: 0; } }
        .reward-mosaic { display: grid; grid-template-columns: repeat(4, 24px); gap: 5px; }
        .reward-mosaic span { width: 24px; height: 24px; border-radius: 4px; background: var(--tile-color); }
        .reward-mosaic span:last-child {
          animation: biasscanner-reward-tile 700ms calc(var(--reward-delay) + 450ms) cubic-bezier(.2,.85,.3,1.15) both;
        }
        @keyframes biasscanner-reward-tile {
          from { opacity: 0; transform: translateY(-34px) rotate(12deg); }
          to { opacity: 1; transform: translateY(0) rotate(0); }
        }
        .reward-archive { position: relative; width: 150px; height: 75px; }
        .reward-archive-box {
          position: absolute;
          left: 42px;
          bottom: 0;
          width: 66px;
          height: 37px;
          border: 2px solid #826b00;
          border-radius: 4px 4px 8px 8px;
          background: #fff4bd;
        }
        .reward-archive-box::before { content: ""; position: absolute; left: 15px; top: 8px; width: 32px; border-top: 3px solid #826b00; }
        .reward-archive-card {
          position: absolute;
          left: 55px;
          top: 0;
          width: 40px;
          height: 45px;
          border: 2px solid #276fae;
          border-radius: 4px;
          background: #eef7ff;
          color: #277a3d;
          font-size: 23px;
          font-weight: 900;
          text-align: center;
          animation: biasscanner-reward-archive 900ms calc(var(--reward-delay) + 380ms) ease-in-out both;
        }
        @keyframes biasscanner-reward-archive {
          0% { opacity: 0; transform: translateY(-26px); }
          40% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(27px) scale(.72); }
        }
        .dialog-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        @media (prefers-reduced-motion: reduce) {
          .reward-scene, .reward-scene * { animation: none !important; }
          .reward-scene { display: none; }
          .reward-scene:last-child { display: flex; opacity: 1; transform: none; }
          .reward-archive-card { opacity: 1; transform: translateY(27px) scale(.72); }
        }
        @media (max-width: 600px) {
          #panel { inset: 8px 8px 62px; transform: none; width: auto; max-height: none; }
          #bar { bottom: 8px; }
        }
    `;

    panel = document.createElement("section");
    panel.id = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "title");

    const header = document.createElement("header");
    const title = document.createElement("h2");
    title.id = "title";
    title.textContent = "BiasScanner";
    const closeButton = document.createElement("button");
    closeButton.id = "close";
    closeButton.className = "secondary";
    closeButton.type = "button";
    header.append(title, closeButton);

    content = document.createElement("div");
    content.id = "content";
    panel.append(header, content);

    barButton = document.createElement("button");
    barButton.id = "bar";
    barButton.type = "button";
    barButton.dataset.kind = "loading";
    shadow.append(style, panel, barButton);
    document.documentElement.appendChild(host);
    barButton.addEventListener("click", () => setPanelOpen(!panelOpen));
    closeButton.addEventListener("click", () => setPanelOpen(false));
  }

  function setPanelOpen(value, language = "en") {
    ensureMounted();
    panelOpen = Boolean(value);
    panel.classList.toggle("open", panelOpen);
    const labels = copy[language] || copy.en;
    if (barButton.dataset.kind === "result") {
      barButton.textContent = panelOpen ? labels.hide : labels.show;
    }
  }

  function showLoading(language) {
    ensureMounted();
    const labels = copy[language] || copy.en;
    panelOpen = false;
    panel.classList.remove("open");
    content.replaceChildren();
    shadow.querySelector("#share-dialog-backdrop")?.remove();
    barButton.dataset.kind = "loading";
    startLoadingAnimation(labels.loading);
  }

  function showError(language, message) {
    ensureMounted();
    stopLoadingAnimation();
    shadow.querySelector("#share-dialog-backdrop")?.remove();
    const labels = copy[language] || copy.en;
    barButton.dataset.kind = "error";
    barButton.textContent = message;
    shadow.querySelector("#title").textContent = labels.title;
    shadow.querySelector("#close").textContent = labels.close;
    content.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    content.appendChild(paragraph);
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

  function sentencePalette(sentence) {
    const primary = sentence.primary_type || sentence.bias_type || "";
    const primaryEntry = primary ? namespace.taxonomy?.lookup(primary, "en") : null;
    if (primaryEntry) {
      return {
        borderColor: primaryEntry.color,
        colors: [primaryEntry.highlightColor],
        groups: [primaryEntry.group],
      };
    }
    const entries = sentenceTypes(sentence)
      .map((typeName) => namespace.taxonomy?.lookup(typeName, "en"))
      .filter(Boolean)
      .filter((entry, index, values) => values.findIndex(
        (candidate) => candidate.group === entry.group,
      ) === index);
    return {
      borderColor: entries[0]?.color || "#f2b400",
      colors: entries.map((entry) => entry.highlightColor),
      groups: entries.map((entry) => entry.group),
    };
  }

  function sentenceCard(record, position, language) {
    const sentence = record.sentence;
    const card = document.createElement("article");
    card.className = "sentence";
    card.dataset.position = String(position);
    const palette = sentencePalette(sentence);
    card.dataset.groups = palette.groups.join(",");
    card.style.borderLeftColor = palette.borderColor;
    if (palette.colors.length === 1) {
      card.style.backgroundColor = palette.colors[0];
    } else if (palette.colors.length > 1) {
      card.style.backgroundImage = `linear-gradient(90deg, ${palette.colors.join(", ")})`;
    }
    const heading = document.createElement("strong");
    heading.textContent = `${position + 1}. ${sentence.text}`;
    const metadata = document.createElement("div");
    metadata.className = "meta";
    const primary = (sentence.primary_type || sentence.bias_type || "").toLocaleLowerCase();
    sentenceTypes(sentence).forEach((typeName, index) => {
      if (index) metadata.append(document.createTextNode(", "));
      const isPrimary = primary && typeName.toLocaleLowerCase() === primary;
      const type = document.createElement(isPrimary ? "strong" : "span");
      type.className = `bias-type${isPrimary ? " primary-type" : ""}`;
      const taxonomyEntry = namespace.taxonomy?.lookup(typeName, language);
      type.textContent = taxonomyEntry?.name || typeName;
      if (taxonomyEntry) {
        type.title = `${taxonomyEntry.groupName}: ${taxonomyEntry.definition}`;
      }
      metadata.appendChild(type);
    });
    metadata.append(document.createTextNode(
      ` · (${Number(sentence.bias_strength).toFixed(1)})`,
    ));
    const description = document.createElement("p");
    description.textContent = sentence.bias_explanation || sentence.bias_description;
    card.append(heading, metadata, description);
    return card;
  }

  function statistic(label, value, assessment = null, definition = "") {
    const element = document.createElement("div");
    element.className = "stat";
    if (assessment) element.classList.add(assessment.tone);
    const valueLine = document.createElement("div");
    valueLine.className = "stat-value";
    const labelNode = document.createElement("strong");
    labelNode.textContent = `${label}: `;
    valueLine.append(labelNode, document.createTextNode(value));
    element.appendChild(valueLine);
    if (assessment) {
      const conclusion = document.createElement("p");
      conclusion.className = "stat-assessment";
      conclusion.textContent = assessment.text;
      element.appendChild(conclusion);
    }
    if (definition) {
      const detail = document.createElement("p");
      detail.className = "stat-definition";
      detail.textContent = definition;
      element.appendChild(detail);
    }
    return element;
  }

  function feedbackControl(language, target) {
    const labels = copy[language] || copy.en;
    const control = document.createElement("div");
    control.className = "rating-feedback";
    const question = document.createElement("span");
    question.className = "rating-feedback-question";
    question.textContent = labels.feedbackQuestion;
    const buttons = [
      ["agree", labels.agree],
      ["disagree", labels.disagree],
    ].map(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.feedback = value;
      button.textContent = label;
      return button;
    });
    const reason = document.createElement("span");
    reason.className = "rating-feedback-reason";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 500;
    input.placeholder = labels.why;
    input.setAttribute("aria-label", labels.why);
    input.value = target.explanation || "";
    reason.appendChild(input);
    const render = () => {
      reason.classList.toggle("visible", Boolean(target.agreement));
      for (const button of buttons) {
        const selected = target.agreement === button.dataset.feedback;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
      }
    };
    for (const button of buttons) {
      button.addEventListener("click", () => {
        target.agreement = button.dataset.feedback;
        if (typeof target.explanation !== "string") target.explanation = "";
        render();
        input.focus();
      });
    }
    input.addEventListener("input", () => { target.explanation = input.value; });
    control.append(question, ...buttons, reason);
    render();
    return control;
  }

  function rewardVariantIndex(randomValue = Math.random()) {
    const normalized = Number.isFinite(randomValue) ? randomValue : 0;
    return Math.min(4, Math.max(0, Math.floor(normalized * 5)));
  }

  function createRewardSequence(labels) {
    const sequence = document.createElement("div");
    sequence.className = "reward-sequence";
    sequence.setAttribute("aria-hidden", "true");
    const makeScene = (title) => {
      const scene = document.createElement("section");
      scene.className = "reward-scene";
      scene.style.setProperty("--reward-delay", "0s");
      const heading = document.createElement("h4");
      heading.textContent = title;
      scene.appendChild(heading);
      sequence.appendChild(scene);
      return scene;
    };
    const caption = (value) => {
      const element = document.createElement("p");
      element.className = "reward-caption";
      element.textContent = value;
      return element;
    };

    const dotColors = ["#fff98f", "#ffcc91", "#8ff28f", "#8debed", "#ff9297", "#c38df0"];
    const variants = [
      {
        name: "contribution",
        render() {
          const scene = makeScene(labels.rewardContribution);
          const flow = document.createElement("div");
          flow.className = "reward-flow";
          dotColors.forEach((color, index) => {
            const dot = document.createElement("span");
            dot.className = "reward-dot";
            const left = 10 + index * 38;
            dot.style.setProperty("--dot-left", `${left}px`);
            dot.style.setProperty("--dot-x", `${100 - left}px`);
            dot.style.setProperty("--dot-color", color);
            dot.style.setProperty("--dot-wait", `${120 + index * 70}ms`);
            flow.appendChild(dot);
          });
          const core = document.createElement("span");
          core.className = "reward-core";
          core.textContent = "✓";
          const badge = document.createElement("span");
          badge.className = "reward-badge";
          badge.textContent = labels.rewardContributionBadge;
          flow.append(core, badge);
          scene.append(flow, caption(labels.rewardContributionBadge));
        },
      },
      {
        name: "stamp",
        render() {
          const scene = makeScene(labels.rewardStamp);
          const stamp = document.createElement("div");
          stamp.className = "reward-stamp-visual";
          stamp.textContent = labels.rewardStampText;
          scene.append(stamp);
        },
      },
      {
        name: "progress",
        render() {
          const scene = makeScene(labels.rewardProgress);
          const progress = document.createElement("div");
          progress.className = "reward-progress-visual";
          const svgNamespace = "http://www.w3.org/2000/svg";
          const progressSvg = document.createElementNS(svgNamespace, "svg");
          progressSvg.setAttribute("viewBox", "0 0 68 68");
          for (const className of ["reward-progress-track", "reward-progress-value"]) {
            const circle = document.createElementNS(svgNamespace, "circle");
            circle.classList.add(className);
            circle.setAttribute("cx", "34");
            circle.setAttribute("cy", "34");
            circle.setAttribute("r", "28");
            progressSvg.appendChild(circle);
          }
          const progressCheck = document.createElement("span");
          progressCheck.className = "reward-progress-check";
          progressCheck.textContent = "✓";
          progress.append(progressSvg, progressCheck);
          scene.append(progress, caption(labels.rewardProgressText));
        },
      },
      {
        name: "mosaic",
        render() {
          const scene = makeScene(labels.rewardMosaic);
          const mosaic = document.createElement("div");
          mosaic.className = "reward-mosaic";
          [...dotColors, "#8dbff0", "#e3e3e3"].forEach((color) => {
            const tile = document.createElement("span");
            tile.style.setProperty("--tile-color", color);
            mosaic.appendChild(tile);
          });
          scene.append(mosaic, caption(labels.rewardMosaicText));
        },
      },
      {
        name: "archive",
        render() {
          const scene = makeScene(labels.rewardArchive);
          const archive = document.createElement("div");
          archive.className = "reward-archive";
          const archiveBox = document.createElement("span");
          archiveBox.className = "reward-archive-box";
          const archiveCard = document.createElement("span");
          archiveCard.className = "reward-archive-card";
          archiveCard.textContent = "✓";
          archive.append(archiveBox, archiveCard);
          scene.append(archive, caption(labels.rewardArchiveText));
        },
      },
    ];
    const selected = variants[rewardVariantIndex()];
    sequence.dataset.rewardVariant = selected.name;
    selected.render();
    return sequence;
  }

  function showResults({
    language,
    conclusion,
    records,
    statistics,
    onDonate,
    overallFeedback = {},
  }) {
    ensureMounted();
    stopLoadingAnimation();
    const labels = copy[language] || copy.en;
    const wasOpen = panelOpen;
    shadow.querySelector("#title").textContent = labels.title;
    shadow.querySelector("#close").textContent = labels.close;
    barButton.dataset.kind = "result";
    content.replaceChildren();
    shadow.querySelector("#share-dialog-backdrop")?.remove();

    const summary = document.createElement("p");
    summary.id = "summary";
    summary.textContent = conclusion || labels.noMatches;
    content.appendChild(summary);

    const stats = document.createElement("div");
    stats.id = "statistics";
    const frequentType = statistics.mostFrequentType
      ? namespace.taxonomy?.lookup(statistics.mostFrequentType, language)
      : null;
    const frequentStatistic = statistic(
      labels.frequent,
      statistics.mostFrequent || "–",
      null,
      frequentType?.definition || "",
    );
    if (frequentType) {
      frequentStatistic.classList.add("taxonomy");
      frequentStatistic.style.borderColor = frequentType.color;
      frequentStatistic.style.backgroundColor = frequentType.highlightColor;
    }
    const ratingStatistic = statistic(
      labels.rating,
      statistics.rating.toFixed(2),
      assessmentFor("rating", statistics.rating * 100, language),
    );
    ratingStatistic.appendChild(feedbackControl(language, overallFeedback));
    stats.append(
      statistic(
        labels.percentage,
        `${statistics.percentage}%`,
        assessmentFor("percentage", statistics.percentage, language),
      ),
      frequentStatistic,
      statistic(
        labels.average,
        statistics.average.toFixed(2),
        assessmentFor("average", statistics.average * 100, language),
      ),
      ratingStatistic,
    );
    content.appendChild(stats);

    const legend = document.createElement("details");
    legend.id = "color-legend";
    const legendTitle = document.createElement("summary");
    legendTitle.textContent = labels.colorLegend;
    const legendImageLink = document.createElement("a");
    legendImageLink.className = "legend-image-link";
    legendImageLink.target = "_blank";
    legendImageLink.rel = "noopener noreferrer";
    const legendAsset = `demo-v2/assets/bias-periodic-table-${language === "de" ? "de" : "en"}.png`;
    const legendAssetUrl = globalThis.chrome?.runtime?.getURL?.(legendAsset)
      || globalThis.browser?.runtime?.getURL?.(legendAsset)
      || legendAsset;
    legendImageLink.href = legendAssetUrl;
    legendImageLink.title = labels.colorLegendAlt;
    const legendImage = document.createElement("img");
    legendImage.className = "legend-image";
    legendImage.src = legendAssetUrl;
    legendImage.alt = labels.colorLegendAlt;
    legendImage.loading = "lazy";
    legendImageLink.appendChild(legendImage);
    legend.append(legendTitle, legendImageLink);
    content.appendChild(legend);

    const knowledge = document.createElement("p");
    knowledge.id = "knowledge-link";
    const knowledgeLink = document.createElement("a");
    knowledgeLink.href = `https://biasscanner.org/bias_knowledge.html?lang=${language === "de" ? "de" : "en"}`;
    knowledgeLink.target = "_blank";
    knowledgeLink.rel = "noopener noreferrer";
    knowledgeLink.textContent = labels.learnMore;
    knowledge.appendChild(knowledgeLink);
    content.appendChild(knowledge);

    const actions = document.createElement("div");
    actions.id = "actions";
    const sortButton = document.createElement("button");
    sortButton.type = "button";
    sortButton.className = "secondary";
    sortButton.textContent = labels.sortStrength;
    const shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.textContent = labels.share;
    actions.append(sortButton, shareButton);
    content.appendChild(actions);

    const list = document.createElement("div");
    content.appendChild(list);
    let strengthSort = false;
    const renderList = () => {
      const ordered = strengthSort
        ? [...records].sort((left, right) => right.sentence.bias_strength - left.sentence.bias_strength)
        : records;
      list.replaceChildren(...ordered.map((record, index) => sentenceCard(record, index, language)));
      sortButton.textContent = strengthSort ? labels.sortOccurrence : labels.sortStrength;
    };
    renderList();
    sortButton.addEventListener("click", () => {
      strengthSort = !strengthSort;
      renderList();
    });

    const notice = document.createElement("p");
    notice.id = "notice";
    content.appendChild(notice);

    shareButton.addEventListener("click", () => {
      if (shadow.querySelector("#share-dialog-backdrop")) return;

      const backdrop = document.createElement("div");
      backdrop.id = "share-dialog-backdrop";
      const dialog = document.createElement("section");
      dialog.id = "share-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "share-dialog-title");
      const dialogTitle = document.createElement("h3");
      dialogTitle.id = "share-dialog-title";
      dialogTitle.textContent = labels.sharePromptTitle;
      const dialogBody = document.createElement("p");
      dialogBody.textContent = labels.sharePromptBody;
      const dialogActions = document.createElement("div");
      dialogActions.className = "dialog-actions";
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "secondary";
      cancelButton.textContent = labels.cancel;
      const confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.className = "confirm-share";
      confirmButton.textContent = labels.confirmShare;
      dialogActions.append(cancelButton, confirmButton);
      dialog.append(dialogTitle, dialogBody, dialogActions);
      backdrop.appendChild(dialog);
      shadow.appendChild(backdrop);

      const closeDialog = () => {
        backdrop.remove();
        shareButton.focus();
      };
      cancelButton.addEventListener("click", closeDialog);
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop && !confirmButton.disabled) closeDialog();
      });
      confirmButton.addEventListener("click", async () => {
        cancelButton.disabled = true;
        confirmButton.disabled = true;
        confirmButton.textContent = labels.sharing;
        let rewardSequence = null;
        try {
          await onDonate();
          notice.textContent = labels.shared;
          dialogTitle.textContent = labels.thanksTitle;
          dialogBody.textContent = labels.shared;
          rewardSequence = createRewardSequence(labels);
          dialog.prepend(rewardSequence);
        } catch (error) {
          const errorMessage = `${labels.shareFailed} ${error?.message || ""}`.trim();
          notice.textContent = errorMessage;
          dialogTitle.textContent = labels.shareFailed;
          dialogBody.textContent = errorMessage;
        }
        dialogActions.replaceChildren();
        const closeDialogButton = document.createElement("button");
        closeDialogButton.type = "button";
        closeDialogButton.textContent = labels.close;
        closeDialogButton.addEventListener("click", closeDialog);
        dialogActions.appendChild(closeDialogButton);
        closeDialogButton.focus();
      });
      confirmButton.focus();
    });

    setPanelOpen(wasOpen, language);
  }

  namespace.reportUi = { showError, showLoading, showResults };
  namespace.reportUiInternals = { assessmentFor, sentencePalette, rewardVariantIndex };
})();


(() => {
  "use strict";

  const namespace = (globalThis.__BIASSCANNER__ ||= {});
  if (namespace.taxonomy) return;

  // Canonical English keys must stay aligned with the model response schema.
  // Each value is: [group, German name, English definition, German definition].
  const types = {
    "Word Choice Bias": ["Framing", "Wortwahl", "This type of bias arises when certain words and expressions with inherently positive or negative connotations, euphemisms, dysphemisms, or (strong) adjectives, adverbs and linguistic markers are chosen that influence perception and imply a judgment about a topic.", "Diese Verzerrung entsteht, wenn bestimmte Wörter und Ausdrücke mit inhärent positiven oder negativen Konnotationen, Euphemismen, Dysphemismen oder (starke) Adjektive, Adverbien und linguistische Marker gewählt werden, die die Wahrnehmung beeinflussen und ein Urteil über ein Thema implizieren."],
    "Emotional Sensationalism Bias": ["Framing", "Emotionaler Sensationalismus", "This is when sentences use alarming, baiting, hyperbolic, or provocative language designed to evoke (strong) emotions, while often focusing predominantly on negative events, aspects or interpretations.", "Dies liegt vor, wenn Sätze alarmierende, ködernde, hyperbolische oder provokative Sprache verwenden, die darauf abzielt, (starke) Emotionen hervorzurufen, wobei sie sich oft überwiegend auf negative Ereignisse, Aspekte oder Interpretationen konzentrieren."],
    "Magnitude Bias": ["Framing", "Magnitude", "This type of bias arises when the severity or relevance of an issue is relativized, downplayed, or exaggerated.", "Diese Verzerrung entsteht, wenn die Schwere oder Relevanz eines Problems relativiert, heruntergespielt oder übertrieben wird."],
    "Rhetorical Bias": ["Framing", "Rhetorisch", "This refers to the use of rhetorical devices, such as repetition, sarcasm, rhyme, irony, or humor, in discussing an issue to shape its perception.", "Dies bezieht sich auf die Verwendung rhetorischer Mittel wie Wiederholung, Sarkasmus, Reim, Ironie oder Humor bei der Diskussion eines Themas, um dessen Wahrnehmung zu formen."],
    "Hollow Symbol Bias": ["Framing", "Leere Symbolik", "This type of bias describes the invoking of symbols, such as phrases, slogans, concepts, ideals, historical events, or public figures, which are charged with meaning beyond their objective reality and usually broad enough to invite personal projection.", "Diese Verzerrung beschreibt das Heraufbeschwören von Symbolen wie Phrasen, Slogans, Konzepten, Idealen, historischen Ereignissen oder öffentlichen Figuren, die mit Bedeutung jenseits ihrer objektiven Realität aufgeladen sind und normalerweise breit genug sind, um persönliche Projektion einzuladen."],
    "False Dichotomy Bias": ["Framing", "Falsche Dichotomie", "This bias occurs when a complex issue is presented as having only two opposing alternatives or being without alternative altogether, even though there might be more possible solutions, positions or outcomes.", "Diese Verzerrung tritt auf, wenn ein komplexes Thema so dargestellt wird, als hätte es nur zwei gegensätzliche Alternativen oder wäre überhaupt ohne Alternative, obwohl es möglicherweise mehr mögliche Lösungen, Positionen oder Ergebnisse gibt."],
    "Flawed Comparison Bias": ["Framing", "Falscher Vergleich", "This bias is characterized by drawing analogies or comparisons between two or more things that may share superficial similarities but are ultimately fundamentally different.", "Diese Verzerrung ist gekennzeichnet durch das Ziehen von Analogien oder Vergleichen zwischen zwei oder mehr Dingen, die oberflächliche Ähnlichkeiten teilen mögen, aber letztendlich grundlegend verschieden sind."],
    "Straw Man Bias": ["Framing", "Strohmann", "This occurs when a position or argument is misrepresented and distorted in a way that makes it easier to attack or refute, often by oversimplifying or exaggerating it.", "Dies tritt auf, wenn eine Position oder ein Argument falsch dargestellt und verzerrt wird, so dass es leichter anzugreifen oder zu widerlegen ist, oft durch Vereinfachung oder Übertreibung."],
    "Opinionated Bias": ["Preferring", "Meinungsstark", "This refers to the inclusion of subjective opinions, beliefs, or interpretations portrayed as objective, factual reporting, obscuring the line between verifiable evidence and personal perspective.", "Dies bezieht sich auf die Einbeziehung subjektiver Meinungen, Überzeugungen oder Interpretationen, die als objektive, faktische Berichterstattung dargestellt werden, wodurch die Grenze zwischen überprüfbaren Beweisen und persönlicher Perspektive verschleiert wird."],
    "Suggestive Questioning Bias": ["Asserting", "Suggestivfrage", "This is the practice of posing suggestive questions that contain implicit assumptions, or lead the audience towards a preconceived notion, often used to promulgate subjective beliefs or doubts under the pretense of neutral inquiry.", "Dies ist die Praxis, suggestive Fragen zu stellen, die implizite Annahmen enthalten oder das Publikum in Richtung einer vorgefassten Vorstellung führen, oft verwendet, um subjektive Überzeugungen oder Zweifel unter dem Vorwand neutraler Untersuchung zu verkünden."],
    "Projection Bias": ["Asserting", "Projektion", "This occurs when thoughts, feelings, motives, or intentions are attributed to others, be it individuals, groups, or entities, without sufficient evidence or direct statements to validate such claims.", "Dies tritt auf, wenn Gedanken, Gefühle, Motive oder Absichten anderen zugeschrieben werden, seien es Einzelpersonen, Gruppen oder Entitäten, ohne ausreichende Beweise oder direkte Aussagen, um solche Behauptungen zu validieren."],
    "Speculation Bias": ["Asserting", "Spekulation", "This is the practice of engaging in speculation based on conjecture about situations or outcomes, rather than relying on concrete facts and definitive evidence.", "Dies ist die Praxis, sich auf Spekulationen basierend auf Vermutungen über Situationen oder Ergebnisse einzulassen, anstatt sich auf konkrete Fakten und definitive Beweise zu verlassen."],
    "Unsubstantiated Claims Bias": ["Asserting", "Unbelegte Behauptung", "This describes the practice of making claims, statements, or assertions that are substantive enough that they should be supported by evidence, and presenting them as factual without actually providing adequate evidence or references to support their validity.", "Dies beschreibt die Praxis, substanzielle Behauptungen oder Aussagen als Tatsachen darzustellen, ohne angemessene Belege oder Quellen für ihre Gültigkeit bereitzustellen."],
    "Vagueness Bias": ["Asserting", "Vagheit", "This is the usage of phrasings so broad and unspecific that they can mean anything and nothing without further clarification, like the usage of catch-all terms (such as 'actions' or 'factors'), vague references (like 'experts' or 'the people') or deliberate concealment of specifics.", "Dies ist die Verwendung von Formulierungen, die so breit und unspezifisch sind, dass sie ohne weitere Klärung alles und nichts bedeuten können, etwa Sammelbegriffe wie ‚Maßnahmen‘ oder ‚Faktoren‘, vage Verweise wie ‚Experten‘ oder ‚das Volk‘ oder die bewusste Verschleierung konkreter Einzelheiten."],
    "False Balance Bias": ["Framing", "Falsche Balance", "This type of bias occurs when opposing viewpoints are presented as equally credible or significant, despite a clear consensus or evidence favoring one side.", "Diese Verzerrung tritt auf, wenn gegensätzliche Standpunkte als gleichermaßen glaubwürdig oder bedeutsam dargestellt werden, obwohl ein klarer Konsens oder Belege eine Seite stützen."],
    "Normalwashing Bias": ["Framing", "Normalisierung", "This bias involves the normalization or reputation laundering of organizations, individuals, or circumstances by avoiding describing them with the objectively applicable but potentially contentious descriptions and context.", "Diese Verzerrung beinhaltet die Normalisierung oder Reputationswäsche von Organisationen, Einzelpersonen oder Umständen, indem objektiv zutreffende, aber möglicherweise strittige Beschreibungen und Kontexte vermieden werden."],
    "Ideological Bias": ["Preferring", "Ideologisch", "This refers to an inclination toward a specific ideology, belief system, or worldview, be it economic, political, religious, or similar frameworks, or associated individuals, organizations, and symbols, resulting in inherent favoritism for aligned ideas while disregarding or disparaging opposing perspectives.", "Dies bezeichnet eine Neigung zu einer bestimmten Ideologie, einem Glaubenssystem oder einer Weltanschauung – etwa wirtschaftlicher, politischer oder religiöser Art – sowie zu damit verbundenen Personen, Organisationen und Symbolen. Daraus entsteht eine Bevorzugung übereinstimmender Ideen, während gegensätzliche Perspektiven ignoriert oder herabgesetzt werden."],
    "Commercial Bias": ["Preferring", "Kommerziell", "This refers to the practice of emphasizing or directly promoting certain companies, their products and services, as well as the support of favorable narratives due to underlying commercial interest.", "Dies bezeichnet die Praxis, bestimmte Unternehmen, ihre Produkte und Dienstleistungen hervorzuheben oder direkt zu bewerben sowie aufgrund zugrunde liegender kommerzieller Interessen vorteilhafte Narrative zu unterstützen."],
    "Ad Hominem Bias": ["Personalizing", "Ad Hominem", "This bias is when an argument is attacked by targeting the character, motives, or other attributes of the one making the argument, rather than addressing the substance of the argument itself.", "Diese Verzerrung liegt vor, wenn ein Argument angegriffen wird, indem Charakter, Motive oder andere Eigenschaften der argumentierenden Person ins Visier genommen werden, anstatt sich mit dem Inhalt des Arguments auseinanderzusetzen."],
    "Mud & Honey Bias": ["Personalizing", "Schmutz & Honig", "This is the practice of using personal attacks, rumors, or unfounded allegations to damage the reputation of an individual or group, or the opposite tendency to excessively praise or idealize them without regard for objective evaluation or criticism.", "Dies ist die Praxis, persönliche Angriffe, Gerüchte oder unbegründete Anschuldigungen zu verwenden, um den Ruf einer Person oder Gruppe zu schädigen, beziehungsweise die gegenteilige Tendenz, sie ohne Rücksicht auf objektive Bewertung oder Kritik übermäßig zu loben oder zu idealisieren."],
    "Horse Race Bias": ["Personalizing", "Pferderennen", "This refers to the exaggerated portrayal of events and issues as personal wins or losses of an individual or group, often as part of a competition between two or more parties.", "Dies bezeichnet die übertriebene Darstellung von Ereignissen und Themen als persönliche Gewinne oder Verluste einer Person oder Gruppe, oft als Teil eines Wettbewerbs zwischen zwei oder mehr Parteien."],
    "Association Bias": ["Personalizing", "Assoziation", "This bias occurs when one links an individual, group, or policy to others with a strong positive or negative reputation by overstating a tenuous connection or citing an irrelevant association.", "Diese Verzerrung tritt auf, wenn eine Person, Gruppe oder Politik mit anderen Akteuren mit stark positivem oder negativem Ruf verknüpft wird, indem eine schwache Verbindung überbetont oder eine irrelevante Assoziation angeführt wird."],
    "Generalization Bias": ["Misreasoning", "Generalisierung", "This type of bias involves attributing actions, beliefs, goals or characteristics of individual members to an entire group or institution, or conversely, assuming that individuals must share traits associated with their group.", "Diese Verzerrung besteht darin, Handlungen, Überzeugungen, Ziele oder Eigenschaften einzelner Mitglieder einer gesamten Gruppe oder Institution zuzuschreiben oder umgekehrt anzunehmen, Einzelpersonen müssten die ihrer Gruppe zugeschriebenen Merkmale teilen."],
    "Causal Misunderstanding Bias": ["Misreasoning", "Kausales Missverständnis", "This is when a cause-and-effect relationship between two variables is misunderstood or assumed without sufficient evidence or considering other factors.", "Dies liegt vor, wenn eine Ursache-Wirkungs-Beziehung zwischen zwei Variablen missverstanden oder ohne ausreichende Belege und ohne Berücksichtigung anderer Faktoren angenommen wird."],
    "Us vs Them Bias": ["Dividing", "Wir gegen Die", "This form of bias arises when humans are divided and assigned membership into ostensibly adversarial groups pitched against each other: an in-group that is collectively and consistently portrayed positively, with legitimate motives and justified actions, and an othered out-group that is consistently described with negative characteristics, illegitimate motives, and unjust actions.", "Diese Form der Verzerrung entsteht, wenn Menschen in scheinbar gegnerische Gruppen eingeteilt und gegeneinander ausgespielt werden: eine Eigengruppe, die kollektiv und durchgehend positiv mit legitimen Motiven und gerechtfertigten Handlungen dargestellt wird, und eine ausgegrenzte Fremdgruppe, die durchgehend mit negativen Eigenschaften, illegitimen Motiven und ungerechten Handlungen beschrieben wird."],
    "Whataboutism Bias": ["Deflecting", "Whataboutism", "This is the practice of responding to an accusation or the pointing out of a problem by making a counter-accusation or raising a different issue, without directly addressing the original argument.", "Dies ist die Praxis, auf eine Anschuldigung oder das Aufzeigen eines Problems mit einer Gegenanschuldigung oder einem anderen Thema zu reagieren, ohne das ursprüngliche Argument direkt anzusprechen."],
    "Shifting Goalpost Bias": ["Deflecting", "Maßstabsverschiebung", "This bias occurs when a position is relativized, often in response to criticism, by excluding counterexamples, shifting criteria, or offering ad hoc justifications to maintain a desired narrative.", "Diese Verzerrung tritt auf, wenn eine Position – häufig als Reaktion auf Kritik – relativiert wird, indem Gegenbeispiele ausgeschlossen, Kriterien verschoben oder Ad-hoc-Rechtfertigungen angeboten werden, um ein gewünschtes Narrativ aufrechtzuerhalten."],
    "No Discussion Bias": ["Deflecting", "Keine Diskussion", "This denotes the practice of painting the outcome of a matter as inevitable and beyond debate, shutting down disagreement and steering conversation only toward adaptation or acceptance.", "Dies bezeichnet die Praxis, den Ausgang einer Angelegenheit als unvermeidlich und jenseits jeder Debatte darzustellen, Widerspruch abzuwürgen und das Gespräch nur noch auf Anpassung oder Akzeptanz zu lenken."],
    "Side Note Bias": ["Deflecting", "Nebensache", "This type of bias arises when potentially unnecessary and unrelated information and remarks are inserted in a discussion to advance a narrative or divert attention from the actual story.", "Diese Verzerrung entsteht, wenn potenziell unnötige und sachfremde Informationen oder Bemerkungen in eine Diskussion eingefügt werden, um ein Narrativ voranzutreiben oder von der eigentlichen Geschichte abzulenken."],
    "Claim & Blame Bias": ["Deflecting", "Fremde Federn & Sündenböcke", "This bias occurs when responsibility is rejected or wrongly assigned, whether by giving undue credit, scapegoating, playing the victim, or outright reversing blame onto the actual victim.", "Diese Verzerrung tritt auf, wenn Verantwortung abgelehnt oder falsch zugewiesen wird – etwa durch unverdiente Anerkennung, das Benennen von Sündenböcken, das Einnehmen der Opferrolle oder eine vollständige Umkehr der Schuld zulasten des tatsächlichen Opfers."],
    "Burden Of Proof Bias": ["Misreasoning", "Beweislast", "This refers to the claim that something is true or false just because it has not yet been proven otherwise, often shifting the responsibility for evidence onto others and appearing in situations where getting absolute proof is unrealistic.", "Dies bezeichnet die Behauptung, etwas sei wahr oder falsch, nur weil das Gegenteil noch nicht bewiesen wurde. Dabei wird die Verantwortung für Belege häufig auf andere verschoben, insbesondere in Situationen, in denen ein absoluter Beweis unrealistisch ist."],
    "Circular Reasoning Bias": ["Misreasoning", "Zirkelschluss", "This occurs when the conclusion of a statement or argument is used as its own justification, essentially bypassing the requirement for evidence or logical reasoning.", "Dies tritt auf, wenn die Schlussfolgerung einer Aussage oder eines Arguments als ihre eigene Begründung verwendet und damit die Notwendigkeit von Belegen oder logischer Argumentation umgangen wird."],
    "Discriminatory Bias": ["Dividing", "Diskriminierung", "This form of bias occurs when stereotypes, generalized or prejudiced statements and unequal representation are promoted or reiterated, reinforcing discrimination or biases against certain individuals or groups, often based on ethnicity, culture, nationality, social background, gender, sexual orientation or religious beliefs.", "Diese Form der Verzerrung tritt auf, wenn Stereotype, verallgemeinernde oder vorurteilsbehaftete Aussagen und ungleiche Darstellungen verbreitet oder wiederholt werden. Dadurch werden Diskriminierung oder Vorurteile gegenüber bestimmten Personen oder Gruppen verstärkt, häufig aufgrund von Ethnizität, Kultur, Nationalität, sozialem Hintergrund, Geschlecht, sexueller Orientierung oder religiöser Überzeugung."],
    "Gatekeeping Bias": ["Dividing", "Gatekeeping", "This refers to the attempt to define who legitimately belongs to a group or an identity or who may legitimately speak on a topic, and who does not, based on arbitrary and highly subjective criteria that lack objective justification.", "Dies bezeichnet den Versuch, anhand willkürlicher und stark subjektiver Kriterien ohne objektive Rechtfertigung festzulegen, wer legitimerweise zu einer Gruppe oder Identität gehört oder über ein Thema sprechen darf – und wer nicht."],
    "Cherry Picking Bias": ["Confirming", "Rosinenpicken", "This form of bias is evident when news stories give undue prominence to aspects and certain details that endorse a particular viewpoint, while omitting information that would contest it.", "Diese Form der Verzerrung liegt vor, wenn Nachrichten bestimmten Aspekten und Einzelheiten, die einen bestimmten Standpunkt stützen, unangemessen viel Gewicht geben und gleichzeitig Informationen auslassen, die ihm widersprechen würden."],
    "Social Compliance Bias": ["Confirming", "Sozialer Konformismus", "This bias occurs when an argument is deemed valid or true simply because it is supported by someone with high social standing or personal involvement, an authority figure, or because it aligns with the current or traditional beliefs of a group one identifies with or of a large group of people.", "Diese Verzerrung tritt auf, wenn ein Argument allein deshalb als gültig oder wahr gilt, weil es von einer Person mit hohem gesellschaftlichem Status oder persönlicher Beteiligung, von einer Autorität oder aufgrund seiner Übereinstimmung mit gegenwärtigen oder traditionellen Überzeugungen einer Bezugsgruppe beziehungsweise einer großen Bevölkerungsgruppe unterstützt wird."],
    "Source Selection Bias": ["Confirming", "Quellenauswahl", "This form of bias arises from citing sources that have a high likelihood of being themselves biased regarding the discussed topic, without providing further contextualization.", "Diese Form der Verzerrung entsteht durch das Zitieren von Quellen, die in Bezug auf das behandelte Thema mit hoher Wahrscheinlichkeit selbst voreingenommen sind, ohne dies weiter einzuordnen."],
    "Anecdotal Evidence Bias": ["Confirming", "Anekdotische Evidenz", "This bias stems from relying on individual stories or examples, rather than considering broader and more representative evidence when forming conclusions.", "Diese Verzerrung entsteht, wenn Schlussfolgerungen auf einzelnen Geschichten oder Beispielen beruhen, anstatt breitere und repräsentativere Belege zu berücksichtigen."],
  };

  // [badge color, German name, light article-highlight color, English definition, German definition]
  const groups = {
    Framing: ["#9a8700", "Framing", "#fff98f", "Bias that (mis)represents a topic or argument in a way that supports a specific reading.", "Bias, der ein Thema oder Argument so (fehl-)darstellt, dass eine bestimmte Lesart unterstützt wird."],
    Personalizing: ["#a95800", "Personalisieren", "#ffcc91", "Bias that moves a discussion from an objective, factual level to a personal level.", "Bias, der eine Diskussion von einer sachlichen, objektiven auf eine persönliche Ebene verschiebt."],
    Deflecting: ["#167b22", "Ablenken", "#8ff28f", "Bias that relativizes or distracts from a topic.", "Bias, der ein Thema relativiert oder davon ablenkt."],
    Asserting: ["#626262", "Behaupten", "#e3e3e3", "Bias based on claiming or assuming things that cannot be known or proven.", "Bias, der auf Behauptungen oder Annahmen beruht, die man nicht wissen oder beweisen kann."],
    Misreasoning: ["#087b82", "Fehlschließen", "#8debed", "Bias that stems from a logical error in an argument.", "Bias, der aus einem logischen Fehler in einem Argument entsteht."],
    Dividing: ["#a92b32", "Spalten", "#ff9297", "Bias that sows division and pits people against one another.", "Bias, der Spaltung fördert und Menschen gegeneinander ausspielt."],
    Preferring: ["#276fae", "Bevorzugen", "#8dbff0", "Bias that shows explicit support for subjective beliefs or opinions.", "Bias, der bestimmte subjektive Überzeugungen oder Meinungen ausdrücklich unterstützt."],
    Confirming: ["#7132a7", "Bestätigen", "#c38df0", "Bias caused by selectively choosing evidence that supports a particular viewpoint.", "Bias, der durch die gezielte Auswahl von Belegen entsteht, die einen bestimmten Standpunkt stützen."],
  };

  function lookupGroup(groupName, language = "en") {
    const entry = groups[groupName];
    if (!entry) return null;
    const [color, germanName, highlightColor, englishDefinition, germanDefinition] = entry;
    return {
      canonicalName: groupName,
      name: language === "de" ? germanName : groupName,
      definition: language === "de" ? germanDefinition : englishDefinition,
      color,
      highlightColor,
    };
  }

  function listGroups(language = "en") {
    return Object.keys(groups).map((groupName) => lookupGroup(groupName, language));
  }

  function normalizeTypeName(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLocaleLowerCase("en")
      .replace(/&/gu, " and ")
      .replace(/[^a-z0-9äöüß]+/gu, " ")
      .trim()
      .replace(/\s+bias$/u, "");
  }

  const canonicalNames = new Map();
  for (const [canonicalName, [, germanName]] of Object.entries(types)) {
    canonicalNames.set(normalizeTypeName(canonicalName), canonicalName);
    canonicalNames.set(normalizeTypeName(germanName), canonicalName);
  }
  const aliases = {
    "opinion bias": "Opinionated Bias",
    "opinionated reporting": "Opinionated Bias",
    "political": "Ideological Bias",
    "insinuative questioning": "Suggestive Questioning Bias",
    "faulty analogy": "Flawed Comparison Bias",
    "empty symbol": "Hollow Symbol Bias",
    "shifting goalposts": "Shifting Goalpost Bias",
    "unsubstantiated claim": "Unsubstantiated Claims Bias",
    "associational": "Association Bias",
    "shift goalpost": "Shifting Goalpost Bias",
    "asserting speculation": "Speculation Bias",
    // Exact German labels emitted by the legacy German model.
    "ad hominem": "Ad Hominem Bias",
    "unklarer zuschreibungs": "Vagueness Bias",
    "anekdotische evidenz": "Anecdotal Evidence Bias",
    "kausaler missverständnis": "Causal Misunderstanding Bias",
    "rosinenpickerei": "Cherry Picking Bias",
    "zirkelschluss": "Circular Reasoning Bias",
    "kommerzieller": "Commercial Bias",
    "diskriminierungs": "Discriminatory Bias",
    "emotionaler sensationalismus": "Emotional Sensationalism Bias",
    "externer validierungs": "Social Compliance Bias",
    "falscher ausgewogenheits": "False Balance Bias",
    "falsche dichotomie": "False Dichotomy Bias",
    "falsche analogie": "Flawed Comparison Bias",
    "verallgemeinerungs": "Generalization Bias",
    "suggestivfragen": "Suggestive Questioning Bias",
    "intergruppen": "Us vs Them Bias",
    "schmutzkampagnen lobeshymnen": "Mud & Honey Bias",
    "meinungsstarker": "Opinionated Bias",
    "politischer": "Ideological Bias",
    "projektions": "Projection Bias",
    "verschobener maßstabs": "Shifting Goalpost Bias",
    "quellen auswahl": "Source Selection Bias",
    "spekulations": "Speculation Bias",
    "strohmann": "Straw Man Bias",
    "unbewiesene behauptungs": "Unsubstantiated Claims Bias",
    "whataboutism": "Whataboutism Bias",
    "wortwahl": "Word Choice Bias",
  };
  for (const [alias, canonicalName] of Object.entries(aliases)) {
    canonicalNames.set(normalizeTypeName(alias), canonicalName);
  }

  function lookup(requestedName, language = "en") {
    const normalizedRequestedName = normalizeTypeName(requestedName);
    let canonicalName = canonicalNames.get(normalizedRequestedName);
    if (!canonicalName) {
      const groupSuffix = normalizedRequestedName.match(
        /^(.*?)\s+(framing|personalizing|deflecting|asserting|misreasoning|dividing|preferring|confirming)$/u,
      );
      if (groupSuffix) {
        const candidate = canonicalNames.get(normalizeTypeName(groupSuffix[1]));
        const requestedGroup = Object.keys(groups).find(
          (groupName) => normalizeTypeName(groupName) === groupSuffix[2],
        );
        if (candidate && requestedGroup && types[candidate]?.[0] === requestedGroup) {
          canonicalName = candidate;
        }
      }
    }
    const entry = types[canonicalName];
    if (!entry) return null;
    const [group, germanName, englishDefinition, germanDefinition] = entry;
    const groupEntry = lookupGroup(group, language);
    return {
      canonicalName,
      name: language === "de" ? germanName : canonicalName,
      definition: language === "de" ? germanDefinition : englishDefinition,
      group,
      groupName: groupEntry?.name || group,
      groupDefinition: groupEntry?.definition || "",
      color: groupEntry?.color || "#6b7280",
      highlightColor: groupEntry?.highlightColor || "#ffd54f",
    };
  }

  namespace.taxonomy = { listGroups, lookup, lookupGroup, normalizeTypeName };
})();

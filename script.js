const API_URL = "https://vibe-proxy-gqv4.onrender.com/v1/chat/completions";
const API_KEY = "sk-vibe-summer-2026";
const mysteryEmojis = ["🔍", "🎩", "🕶️", "🕯️", "🧭", "🦇", "🕷️", "💀", "🧩"];

const mysteryPrompts = [
  "A famous violinist is found dead in a locked music room, and the final note of a melody points to a hidden culprit.",
  "A billionaire disappears during a thunderstorm, leaving behind muddy footprints, a broken cufflink, and three contradictory alibis.",
  "At a lighthouse on the edge of the cliffs, a keeper vanishes without a sound, but the lighthouse lamp keeps blinking a code.",
  "A jewel courier is murdered in a museum after a silent alarm, and the only witnesses are a sleeping guard, a nervous curator, and a thief in disguise.",
  "A train arrives at the station with one passenger missing and one suitcase locked from the inside, while the conductor swears no one boarded."
];

const personalityPresets = {
  detective: ["sharp", "observant", "calm", "intuitive", "dramatic"],
  forensics: ["clinical", "precise", "technical", "meticulous", "evidence-driven"],
  interrogator: ["skeptical", "tenacious", "confident", "piercing", "strategic"]
};

const state = {
  activePrompt: mysteryPrompts[0],
  enabledAgents: {
    detective: true,
    forensics: true,
    interrogator: true
  },
  order: ["detective", "forensics", "interrogator"],
  personalities: {
    detective: [],
    forensics: [],
    interrogator: []
  },
  selectedAgent: "detective",
  mysteryIconIndex: 0
};

const outputContainer = document.getElementById("agentOutputs");
const workflowTrace = document.getElementById("workflowTrace");
const userInput = document.getElementById("userInput");
const runAgentsBtn = document.getElementById("runAgentsBtn");
const choosePersonalityBtn = document.getElementById("choosePersonalityBtn");
const personalityModal = document.getElementById("personalityModal");
const personaAgentSelect = document.getElementById("personaAgentSelect");
const personalityOptions = document.getElementById("personalityOptions");
const selectedTraits = document.getElementById("selectedTraits");
const customPersonalityInput = document.getElementById("customPersonalityInput");
const closeModalBtn = document.getElementById("closeModalBtn");
const mysteryIconToggle = document.getElementById("toggleMysteryIcon");

function init() {
  renderPromptButtons();
  renderCaseList();
  createMysteryDecor();
  setActivePrompt(mysteryPrompts[0]);
  renderPersonalityOptions();
  renderSelectedTraits();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-toggle]").forEach((toggle) => {
    toggle.addEventListener("change", (event) => {
      const agent = event.target.dataset.toggle;
      state.enabledAgents[agent] = event.target.checked;
    });
  });

  runAgentsBtn.addEventListener("click", runAgentWorkflow);
  choosePersonalityBtn.addEventListener("click", openPersonalityModal);
  closeModalBtn.addEventListener("click", closePersonalityModal);
  mysteryIconToggle.addEventListener("click", toggleMysteryIcon);

  personaAgentSelect.addEventListener("change", (event) => {
    state.selectedAgent = event.target.value;
    renderPersonalityOptions();
    renderSelectedTraits();
  });

  document.getElementById("addCustomPersonalityBtn").addEventListener("click", addCustomTrait);
  document.getElementById("savePersonalityBtn").addEventListener("click", saveSelectedPersonality);

  customPersonalityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addCustomTrait();
    }
  });

  personalityModal.addEventListener("click", (event) => {
    if (event.target === personalityModal) closePersonalityModal();
  });
}

function renderPromptButtons() {
  const container = document.getElementById("mysteryPrompts");
  mysteryPrompts.forEach((prompt, index) => {
    const btn = document.createElement("button");
    btn.className = "prompt-pill" + (index === 0 ? " active" : "");
    btn.type = "button";
    btn.textContent = `Case ${index + 1}`;
    btn.addEventListener("click", () => {
      setActivePrompt(prompt);
    });
    container.appendChild(btn);
  });
}

function renderCaseList() {
  const container = document.getElementById("caseSidebarList");
  container.innerHTML = "";

  mysteryPrompts.forEach((prompt, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "case-sidebar-item" + (index === 0 ? " active" : "");
    btn.textContent = `Case ${index + 1}`;
    btn.addEventListener("click", () => {
      setActivePrompt(prompt);
    });
    container.appendChild(btn);
  });
}

function setActivePrompt(prompt) {
  state.activePrompt = prompt;
  userInput.value = prompt;

  const idx = mysteryPrompts.indexOf(prompt);

  document.querySelectorAll(".prompt-pill").forEach((pill, index) => {
    pill.classList.toggle("active", index === idx);
  });

  document.querySelectorAll(".case-sidebar-item").forEach((item, index) => {
    item.classList.toggle("active", index === idx);
  });
}

function openPersonalityModal() {
  personaAgentSelect.value = state.selectedAgent;
  renderPersonalityOptions();
  renderSelectedTraits();
  personalityModal.classList.remove("hidden");
  personalityModal.setAttribute("aria-hidden", "false");
}

function closePersonalityModal() {
  personalityModal.classList.add("hidden");
  personalityModal.setAttribute("aria-hidden", "true");
  customPersonalityInput.value = "";
}

function renderPersonalityOptions() {
  personalityOptions.innerHTML = "";
  const options = personalityPresets[state.selectedAgent] || [];

  options.forEach((trait) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "personality-tag" + (state.personalities[state.selectedAgent].includes(trait) ? " selected" : "");
    chip.textContent = trait;
    chip.addEventListener("click", () => togglePersonalityTrait(trait));
    personalityOptions.appendChild(chip);
  });
}

function renderSelectedTraits() {
  selectedTraits.innerHTML = "";
  const current = state.personalities[state.selectedAgent] || [];

  if (!current.length) {
    const empty = document.createElement("span");
    empty.textContent = "No traits selected yet";
    empty.style.color = "var(--muted)";
    selectedTraits.appendChild(empty);
    return;
  }

  current.forEach((trait) => {
    const item = document.createElement("span");
    item.className = "selected-trait";
    item.innerHTML = `${trait}<button type="button" class="remove-trait" data-trait="${trait}">×</button>`;
    item.querySelector(".remove-trait").addEventListener("click", () => removeTrait(trait));
    selectedTraits.appendChild(item);
  });
}

function togglePersonalityTrait(trait) {
  const current = state.personalities[state.selectedAgent] || [];
  if (current.includes(trait)) {
    removeTrait(trait);
    return;
  }
  if (current.length >= 2) {
    alert("You can select up to two personality traits per agent.");
    return;
  }
  state.personalities[state.selectedAgent].push(trait);
  renderPersonalityOptions();
  renderSelectedTraits();
}

function addCustomTrait() {
  const value = customPersonalityInput.value.trim();
  if (!value) return;
  const current = state.personalities[state.selectedAgent] || [];
  if (current.includes(value)) {
    customPersonalityInput.value = "";
    return;
  }
  if (current.length >= 2) {
    alert("You can select up to two personality traits per agent.");
    return;
  }
  state.personalities[state.selectedAgent].push(value);
  customPersonalityInput.value = "";
  renderPersonalityOptions();
  renderSelectedTraits();
}

function removeTrait(trait) {
  state.personalities[state.selectedAgent] = (state.personalities[state.selectedAgent] || []).filter((item) => item !== trait);
  renderPersonalityOptions();
  renderSelectedTraits();
}

function saveSelectedPersonality() {
  closePersonalityModal();
}

function appendTrace(step) {
  const item = document.createElement("li");
  item.className = "trace-item";
  item.innerHTML = `<strong>${step.title}</strong><br>${step.detail}`;
  workflowTrace.appendChild(item);
}

function appendOutput(agentName, content) {
  const card = document.createElement("article");
  card.className = "agent-output";
  const label = agentName.charAt(0).toUpperCase() + agentName.slice(1);
  card.innerHTML = `
    <div class="output-head">
      <span class="output-badge">${label}</span>
      <span class="status-dot">✓</span>
    </div>
    <p class="output-body">${content}</p>
  `;
  outputContainer.appendChild(card);
}

function getRequestedAgents(message) {
  const requested = [];
  const normalized = message.toLowerCase();

  state.order.forEach((agentName) => {
    const pattern = new RegExp(`\\b${agentName}\\b`, "i");
    if (pattern.test(normalized)) {
      requested.push(agentName);
    }
  });

  return [...new Set(requested)];
}

async function runAgentWorkflow() {
  const userMessage = userInput.value.trim() || state.activePrompt;
  outputContainer.innerHTML = "";
  workflowTrace.innerHTML = "";

  const requestedAgents = getRequestedAgents(userMessage);

  if (requestedAgents.length > 0) {
    const disabledTargets = requestedAgents.filter((agentName) => !state.enabledAgents[agentName]);
    const activeTargets = requestedAgents.filter((agentName) => state.enabledAgents[agentName]);

    if (disabledTargets.length > 0) {
      const unavailableText = disabledTargets
        .map((agentName) => `The ${agentName} is currently unavailable.`)
        .join("\n");

      appendOutput("orchestrator", unavailableText);
      appendTrace({ title: "Orchestrator check", detail: `Requested agents: ${requestedAgents.join(", ")}. Disabled agents were blocked.` });
      return;
    }

    if (!activeTargets.length) {
      appendOutput("orchestrator", "No available agents can answer this request right now.");
      appendTrace({ title: "Orchestrator check", detail: "No active agent matched the request." });
      return;
    }

    let context = `Case brief: ${userMessage}`;

    for (const agentName of activeTargets) {
      appendTrace({ title: `Stage: ${agentName}`, detail: "Targeted agent activated for the requested case." });
      const agentResponse = await runAgent(agentName, userMessage, context);
      appendOutput(agentName, agentResponse);
      context = `${context}\n\n${agentName.toUpperCase()} summary: ${agentResponse}`;
      appendTrace({ title: `${agentName} complete`, detail: "Findings were delivered to the requested workflow only." });
    }

    appendTrace({ title: "Final synthesis", detail: "The orchestrator handled the requested agent workflow and ignored the rest." });
    return;
  }

  const enabledOrder = state.order.filter((name) => state.enabledAgents[name]);

  if (!enabledOrder.length) {
    outputContainer.innerHTML = '<div class="agent-output"><p class="output-body">No agents are active. Turn one on before launching the case.</p></div>';
    appendTrace({ title: "System", detail: "No agents selected." });
    return;
  }

  let context = `Case brief: ${userMessage}`;

  for (const agentName of enabledOrder) {
    appendTrace({ title: `Stage: ${agentName}`, detail: "Agent activated and evaluating the case." });
    const agentResponse = await runAgent(agentName, userMessage, context);
    appendOutput(agentName, agentResponse);
    context = `${context}\n\n${agentName.toUpperCase()} summary: ${agentResponse}`;
    appendTrace({ title: `${agentName} complete`, detail: "Findings passed to the next stage." });
  }

  appendTrace({ title: "Final synthesis", detail: "The orchestrator has reviewed the full case movement." });
  outputContainer.insertAdjacentHTML(
    "beforeend",
    '<article class="agent-output"><div class="output-head"><span class="output-badge">Case Summary</span><span class="status-dot">✦</span></div><p class="output-body">The case has been analyzed by the active agents. Review the detective notes, forensic clues, and interrogator contradictions to determine the culprit.</p></article>'
  );
}

async function runAgent(agentName, message, context) {
  const agentFns = {
    detective: detectiveAgent,
    forensics: forensicsAgent,
    interrogator: interrogatorAgent
  };

  if (!agentFns[agentName]) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  return agentFns[agentName](message, context, state.personalities[agentName]);
}

async function detectiveAgent(message, context, personalities) {
  const prompt = buildAgentPrompt({
    agent: "detective",
    task: "Analyze witness statements, timelines, contradictions, and likely motive. Focus on narrative consistency and suspect movement.",
    message,
    context,
    personalities
  });
  return fetchFromLlm(prompt, "Detective");
}

async function forensicsAgent(message, context, personalities) {
  const prompt = buildAgentPrompt({
    agent: "forensics",
    task: "Examine physical evidence, fingerprints, objects, traces, and scene details. Prioritize what can be proven and what object or clue most strongly implicates a suspect.",
    message,
    context,
    personalities
  });
  return fetchFromLlm(prompt, "Forensics");
}

async function interrogatorAgent(message, context, personalities) {
  const prompt = buildAgentPrompt({
    agent: "interrogator",
    task: "Identify contradictions, suspicious shifts in stories, omission patterns, and unreliable testimony. Highlight who is lying or hiding something and why.",
    message,
    context,
    personalities
  });
  return fetchFromLlm(prompt, "Interrogator");
}

function buildAgentPrompt({ agent, task, message, context, personalities }) {
  const traitText = personalities && personalities.length
    ? `Your tone is ${personalities.join(", ")}.`
    : "Your tone is calm, sharp, and focused.";

  return `You are the ${agent} agent. ${traitText}

Goal: ${task}

Case context: ${context}

User request: ${message}

Answer in clear, natural English. Use 4 to 6 sentences max. Keep it readable, interesting, and mysterious. Avoid heavy jargon and avoid sounding robotic. Explain the main clue, the weak point in the story, and what matters most.

Example style: "The timeline does not match. One witness keeps changing the timing, which suggests a cover-up. The missing item matters more than the weapon. I would watch the person who knew the room and the route before the alarm."`;
}

async function fetchFromLlm(prompt, label) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "class-chat-model",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "No response returned.";
    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error(error);
    const fallback = {
      Detective: "The timeline does not hold together. One witness keeps changing the timing, and that usually means a cover-up. The important clue is not the weapon; it is the route the suspect took before the scene changed. I would watch the person who knew the room better than they should.",
      Forensics: "The evidence is pointing to a hidden object rather than a dramatic clue. There are traces on the scene that suggest someone handled the scene after the crime. The key question is not who was there first, but who stayed long enough to leave a mark.",
      Interrogator: "The story cracks at the key moment. One account shifts when the timeline is pressed, and that usually means the truth is being folded away. The person who sounds most certain is often the one concealing the most."
    };

    return fallback[label] || "The clues are narrowing, but the real answer still waits in the gap between what was seen and what was hidden.";
  }
}

function createMysteryDecor() {
  const layer = document.getElementById("mysteryEmojisLayer");
  if (!layer) return;

  const icons = ["🕵️", "🦇", "🕯️", "🧭", "🧩", "💀", "🕶️", "🎩", "🔍"];
  for (let i = 0; i < 6; i += 1) {
    const item = document.createElement("span");
    item.className = "mystery-emoji";
    item.dataset.index = String(i);
    item.dataset.emojiIndex = String((i + state.mysteryIconIndex) % icons.length);
    item.textContent = icons[(i + state.mysteryIconIndex) % icons.length];
    item.style.animationDelay = `${(i % 6) * 0.7}s`;
    item.addEventListener("click", () => {
      triggerEmojiSwap(item);
    });
    layer.appendChild(item);
  }
}

function triggerEmojiSwap(item) {
  const icons = ["🕵️", "🦇", "🕯️", "🧭", "🧩", "💀", "🕶️", "🎩", "🔍"];
  item.classList.remove("glitching");
  void item.offsetWidth;
  item.classList.add("glitching");

  const currentIndex = Number(item.dataset.emojiIndex || 0);
  const nextIndex = (currentIndex + 1) % icons.length;
  item.dataset.emojiIndex = String(nextIndex);
  item.textContent = icons[nextIndex];

  setTimeout(() => {
    item.classList.remove("glitching");
  }, 420);
}

function updateTopEmojiRow() {
  const items = document.querySelectorAll(".mystery-emoji");
  const icons = ["🕵️", "🦇", "🕯️", "🧭", "🧩", "💀", "🕶️", "🎩", "🔍"];

  items.forEach((item, index) => {
    const currentIndex = Number(item.dataset.emojiIndex || 0);
    const nextIndex = (currentIndex + 1) % icons.length;
    item.dataset.emojiIndex = String(nextIndex);
    item.textContent = icons[nextIndex];
    item.classList.remove("glitching");
    void item.offsetWidth;
    item.classList.add("glitching");
    setTimeout(() => item.classList.remove("glitching"), 420);
  });
}

function toggleMysteryIcon() {
  const icon = mysteryIconToggle.querySelector("span");
  state.mysteryIconIndex = (state.mysteryIconIndex + 1) % mysteryEmojis.length;

  mysteryIconToggle.classList.remove("glitching");
  void mysteryIconToggle.offsetWidth;
  mysteryIconToggle.classList.add("glitching");

  icon.textContent = mysteryEmojis[state.mysteryIconIndex];
  icon.style.transform = "rotate(180deg)";
  setTimeout(() => {
    icon.style.transform = "rotate(0deg)";
  }, 320);

  updateTopEmojiRow();

  const burst = document.createElement("span");
  burst.className = "mystery-emoji";
  burst.textContent = mysteryEmojis[state.mysteryIconIndex];
  burst.style.fontSize = "3rem";
  burst.style.opacity = "1";
  burst.style.animation = "floatEmoji 1.2s ease-in-out forwards";
  burst.style.filter = "drop-shadow(0 0 22px rgba(255, 94, 196, 0.9))";
  burst.style.zIndex = "13";
  document.getElementById("mysteryEmojisLayer").appendChild(burst);

  setTimeout(() => burst.remove(), 1200);
}

init();

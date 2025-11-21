const i18nDict = {
  zh: {
    title: "密码生成器",
    subtitle: "快速生成安全、可定制的随机密码",
    language: "语言",
    copy: "复制",
    strength_unknown: "强度未知",
    length: "密码长度",
    charsets: "字符集",
    upper: "大写字母",
    lower: "小写字母",
    numbers: "数字",
    symbols: "特殊符号",
    exclude: "排除易混字符 (0/O/1/l)",
    advanced: "高级选项",
    require_all: "必须包含已选字符集",
    pronounceable: "生成易读模式 (CVCV)",
    titlecase: "首字母大写 + 末尾数字",
    generate: "生成密码",
    clear_history: "清除历史",
    history: "最近生成",
    tips_title: "密码安全建议",
    tip_length: "长度越长越安全，推荐 16 位以上。",
    tip_unique: "不同网站使用不同密码，避免复用。",
    tip_manager: "配合密码管理器保存与自动填充。",
    footer: "密码仅在本地生成和暂存，不会上传服务器。"
  },
  en: {
    title: "Password Generator",
    subtitle: "Create secure, customizable passwords instantly",
    language: "Language",
    copy: "Copy",
    strength_unknown: "Strength unknown",
    length: "Length",
    charsets: "Character sets",
    upper: "Uppercase letters",
    lower: "Lowercase letters",
    numbers: "Numbers",
    symbols: "Symbols",
    exclude: "Exclude similar characters (0/O/1/l)",
    advanced: "Advanced options",
    require_all: "Require each selected charset",
    pronounceable: "Pronounceable mode (CVCV)",
    titlecase: "Title case + trailing number",
    generate: "Generate",
    clear_history: "Clear history",
    history: "Recent passwords",
    tips_title: "Password hygiene tips",
    tip_length: "Longer is safer; aim for 16+ characters.",
    tip_unique: "Use different passwords per service.",
    tip_manager: "Store with a password manager.",
    footer: "Passwords are generated locally; nothing is uploaded."
  }
};

const similarChars = new Set(["0", "O", "o", "1", "l", "I"]);
const historyKey = "password_history_v1";
const langKey = "password_lang_v1";

const elements = {
  passwordOutput: document.getElementById("passwordOutput"),
  copyBtn: document.getElementById("copyBtn"),
  generateBtn: document.getElementById("generateBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyList: document.getElementById("historyList"),
  strengthBar: document.getElementById("strengthBar"),
  strengthLabel: document.getElementById("strengthLabel"),
  lengthRange: document.getElementById("lengthRange"),
  lengthValue: document.getElementById("lengthValue"),
  includeUpper: document.getElementById("includeUpper"),
  includeLower: document.getElementById("includeLower"),
  includeNumbers: document.getElementById("includeNumbers"),
  includeSymbols: document.getElementById("includeSymbols"),
  excludeSimilar: document.getElementById("excludeSimilar"),
  requireAllSets: document.getElementById("requireAllSets"),
  pronounceable: document.getElementById("pronounceable"),
  titleCase: document.getElementById("titleCase")
};

const langButtons = document.querySelectorAll(".lang-btn");
let currentLocale = "zh";

const charsetMap = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>/?"
};

function syncLangButtons(locale) {
  langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === locale;
    btn.setAttribute("aria-pressed", isActive);
    btn.classList.toggle("active", isActive);
  });
}

function applyLocale(locale) {
  const dict = i18nDict[locale] ?? i18nDict.zh;
  currentLocale = dict === i18nDict[locale] ? locale : "zh";
  document.documentElement.lang = currentLocale;
  syncLangButtons(currentLocale);
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) node.textContent = dict[key];
  });
  elements.passwordOutput.placeholder =
    currentLocale === "en" ? "Click generate" : "点击生成密码";
  localStorage.setItem(langKey, currentLocale);
}

function filterSimilar(text) {
  return [...text].filter((char) => !similarChars.has(char)).join("");
}

function generateCharset() {
  let charset = "";
  if (elements.includeUpper.checked) charset += charsetMap.upper;
  if (elements.includeLower.checked) charset += charsetMap.lower;
  if (elements.includeNumbers.checked) charset += charsetMap.numbers;
  if (elements.includeSymbols.checked) charset += charsetMap.symbols;
  if (elements.excludeSimilar.checked) charset = filterSimilar(charset);
  return charset;
}

function generatePronounceable(length) {
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const vowels = "aeiou";
  let password = "";
  for (let i = 0; i < length; i++) {
    const set = i % 2 === 0 ? consonants : vowels;
    const char = set[Math.floor(Math.random() * set.length)];
    password += char;
  }
  return password.slice(0, length);
}

function ensureAllSets(passwordArray, selectedSets) {
  selectedSets.forEach((set) => {
    const pool = charsetMap[set];
    const index = Math.floor(Math.random() * passwordArray.length);
    passwordArray[index] = pool[Math.floor(Math.random() * pool.length)];
  });
}

function generatePassword() {
  const length = Number(elements.lengthRange.value);
  const selectedSets = ["upper", "lower", "numbers", "symbols"].filter(
    (set) => elements[`include${set[0].toUpperCase()}${set.slice(1)}`]?.checked
  );

  let password = "";

  if (elements.pronounceable.checked) {
    password = generatePronounceable(length);
  } else {
    const charset = generateCharset();
    if (!charset) return "";
    const chars = [];
    for (let i = 0; i < length; i++) {
      const char = charset[Math.floor(Math.random() * charset.length)];
      chars.push(char);
    }
    if (elements.requireAllSets.checked && selectedSets.length > 0) {
      ensureAllSets(chars, selectedSets);
    }
    password = chars.join("");
  }

  if (elements.titleCase.checked) {
    password = password.charAt(0).toUpperCase() + password.slice(1);
    if (!/[0-9]$/.test(password)) {
      const digit = Math.floor(Math.random() * 10);
      password = password.slice(0, -1) + digit;
    }
  }

  return password;
}

function evaluateStrength(password) {
  if (!password) return { label: "strength_unknown", value: 0 };
  let score = 0;
  const lengthScore = Math.min(password.length / 64, 1);
  score += lengthScore;

  const variety =
    /[a-z]/.test(password) +
    /[A-Z]/.test(password) +
    /[0-9]/.test(password) +
    /[^a-zA-Z0-9]/.test(password);
  score += variety * 0.2;
  score = Math.min(score, 1);

  let label;
  if (score < 0.33) label = "strength_weak";
  else if (score < 0.66) label = "strength_medium";
  else label = "strength_strong";
  return { value: score, label };
}

function getStrengthLabel(labelKey, locale) {
  const labels = {
    zh: {
      strength_weak: "弱",
      strength_medium: "中",
      strength_strong: "强",
      strength_unknown: "强度未知"
    },
    en: {
      strength_weak: "Weak",
      strength_medium: "Medium",
      strength_strong: "Strong",
      strength_unknown: "Strength unknown"
    }
  };
  return labels[locale]?.[labelKey] ?? labels.zh[labelKey];
}

function updateStrength(password) {
  const { value, label } = evaluateStrength(password);
  elements.strengthBar.style.width = `${value * 100}%`;
  elements.strengthLabel.textContent = getStrengthLabel(label, currentLocale);
}

function updateHistory(newPassword) {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  if (newPassword) {
    history.unshift({ value: newPassword, time: Date.now() });
  }
  const sliced = history.slice(0, 5);
  localStorage.setItem(historyKey, JSON.stringify(sliced));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  elements.historyList.innerHTML = "";
  history.forEach((item, idx) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = item.value;
    const btn = document.createElement("button");
    btn.textContent = "⧉";
    btn.setAttribute("aria-label", `Copy password ${idx + 1}`);
    btn.addEventListener("click", () => copyToClipboard(item.value));
    li.appendChild(span);
    li.appendChild(btn);
    elements.historyList.appendChild(li);
  });
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    elements.copyBtn.textContent =
      currentLocale === "en" ? "Copied!" : "已复制";
    setTimeout(() => {
      elements.copyBtn.textContent = i18nDict[currentLocale].copy;
    }, 1500);
  } catch {
    alert("复制失败，请手动复制。");
  }
}

function initEvents() {
  elements.lengthRange.addEventListener("input", () => {
    elements.lengthValue.textContent = elements.lengthRange.value;
  });

  elements.generateBtn.addEventListener("click", () => {
    const password = generatePassword();
    if (!password) {
      elements.passwordOutput.value = "";
      updateStrength("");
      return;
    }
    elements.passwordOutput.value = password;
    updateStrength(password);
    updateHistory(password);
  });

  elements.copyBtn.addEventListener("click", () =>
    copyToClipboard(elements.passwordOutput.value)
  );

  elements.clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(historyKey);
    renderHistory();
  });

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.dataset.lang;
      if (selected && selected !== currentLocale) {
        applyLocale(selected);
        updateStrength(elements.passwordOutput.value);
      }
    });
  });
}

function init() {
  const savedLang = localStorage.getItem(langKey) || "zh";
  applyLocale(savedLang);
  elements.lengthValue.textContent = elements.lengthRange.value;
  renderHistory();
  initEvents();
}

document.addEventListener("DOMContentLoaded", init);


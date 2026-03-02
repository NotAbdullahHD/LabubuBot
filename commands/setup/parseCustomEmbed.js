const { EmbedBuilder } = require("discord.js");

// ─────────────────────────────────────────────────────
//  resolveVariables(text, context)
// ─────────────────────────────────────────────────────
function resolveVariables(text, context = {}) {
  if (!text || typeof text !== "string") return text;

  const { member, guild } = context;
  const user = context.user || member?.user;

  const vars = {};

  if (user) {
    vars["{user}"]        = member ? `<@${user.id}>` : user.username;
    vars["{user.name}"]   = user.username;
    vars["{user.tag}"]    = user.tag || user.username;
    vars["{user.id}"]     = user.id;
    vars["{user.avatar}"] = user.displayAvatarURL?.({ size: 256 }) ?? "";
  }

  if (guild) {
    vars["{server}"]       = guild.name;
    vars["{server.id}"]    = guild.id;
    vars["{server.count}"] = guild.memberCount?.toString() ?? "?";
    vars["{server.icon}"]  = guild.iconURL?.({ size: 256 }) ?? "";
  }

  const now     = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  vars["{date}"]     = dateStr;
  vars["{time}"]     = timeStr;
  vars["{datetime}"] = `${dateStr} at ${timeStr}`;

  let result = text;
  for (const [placeholder, replacement] of Object.entries(vars)) {
    result = result.split(placeholder).join(replacement ?? "");
  }
  return result;
}

// ─────────────────────────────────────────────────────
//  parseCustomEmbed(inputString, context)
//  Robust parser for {embed}$v{key: value} format
// ─────────────────────────────────────────────────────
function parseCustomEmbed(inputString, context = {}) {
  if (!inputString || typeof inputString !== "string") {
    throw new Error("Input must be a non-empty string.");
  }

  // Normalise: strip BOM, \r, and trim surrounding whitespace
  let trimmed = inputString
    .replace(/^\uFEFF/, "")   // remove BOM (invisible char pasted from some editors)
    .replace(/\r\n/g, "\n")   // Windows line endings → Unix
    .replace(/\r/g, "\n")     // bare \r → \n
    .trim();

  if (!trimmed.startsWith("{embed}")) {
    throw new Error(
      `Embed code must start with {embed}. Got: "${trimmed.slice(0, 30)}"`
    );
  }

  const raw    = trimmed.slice("{embed}".length);
  const tokens = raw.split("$v").filter(t => t.trim().length > 0);

  const props = {};

  for (const token of tokens) {
    const inner = token.trim();

    // Must start with {
    if (!inner.startsWith("{")) continue;

    // Be lenient about closing } — accept even if truncated
    // Strip leading { and optional trailing }
    const content = inner.startsWith("{") && inner.endsWith("}")
      ? inner.slice(1, -1)
      : inner.slice(1);

    // Split on FIRST colon only (values may contain colons — e.g. URLs, timestamps)
    const colonIndex = content.indexOf(":");
    if (colonIndex === -1) continue;

    const key   = content.slice(0, colonIndex).trim();
    const value = content.slice(colonIndex + 1).trim();

    // Only store recognised keys to avoid junk
    const VALID_KEYS = new Set([
      "title", "description", "url", "color",
      "authorName", "authorIcon",
      "thumbnail", "image",
      "footerText", "footerIcon"
    ]);

    if (key && value && VALID_KEYS.has(key)) {
      // Decode \\n back to real newlines (description encoded by embed builder website)
      const decoded = value.replace(/\\n/g, "\n");
      props[key] = resolveVariables(decoded, context);
    }
  }

  const embed = new EmbedBuilder();

  if (props.title)              embed.setTitle(props.title.slice(0, 256));
  if (props.url && props.title) {
    try { embed.setURL(props.url); } catch {}
  }
  if (props.description)        embed.setDescription(props.description.slice(0, 4096));

  if (props.color) {
    try { embed.setColor(props.color); }
    catch { console.warn(`[parseCustomEmbed] Invalid color "${props.color}", skipping.`); }
  }

  if (props.authorName) {
    const authorOpts = { name: props.authorName.slice(0, 256) };
    if (props.authorIcon) {
      try {
        // Test it's a valid URL before passing — bad URLs crash setAuthor
        new URL(props.authorIcon);
        authorOpts.iconURL = props.authorIcon;
      } catch {}
    }
    embed.setAuthor(authorOpts);
  }

  if (props.thumbnail) {
    try { new URL(props.thumbnail); embed.setThumbnail(props.thumbnail); } catch {}
  }

  if (props.image) {
    try { new URL(props.image); embed.setImage(props.image); } catch {}
  }

  if (props.footerText) {
    const footerOpts = { text: props.footerText.slice(0, 2048) };
    if (props.footerIcon) {
      try { new URL(props.footerIcon); footerOpts.iconURL = props.footerIcon; } catch {}
    }
    embed.setFooter(footerOpts);
  }

  embed.setTimestamp();
  return embed;
}

module.exports = { parseCustomEmbed, resolveVariables };
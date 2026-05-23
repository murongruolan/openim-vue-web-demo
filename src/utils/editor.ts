export const replaceEmoji2Str = (text: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const emojiEls: HTMLImageElement[] = Array.from(doc.querySelectorAll(".emojione"));
  emojiEls.forEach((face) => {
    const escapedOut = face.outerHTML.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    text = text.replace(new RegExp(escapedOut, "g"), face.alt);
  });
  return text;
};

let textAreaDom: HTMLTextAreaElement | null = null;

const decodeHtmlEntities = (text: string) => {
  if (!textAreaDom) {
    textAreaDom = document.createElement("textarea");
  }
  textAreaDom.innerHTML = text;
  return textAreaDom.value;
};

const convertChar = (text: string) => text.replace(/&nbsp;/gi, " ");

// Source: src/components/CKEditor/utils.ts
export const getCleanText = (html: string) => {
  let text = replaceEmoji2Str(html);
  text = text.replace(/<\/p><p>/g, "\n");
  text = text.replace(/<br\s*[/]?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = convertChar(text);
  text = decodeHtmlEntities(text);
  return text.trim();
};

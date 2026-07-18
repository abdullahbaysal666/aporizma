/* Service worker: context menu -> stash selection -> open result window. */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "aporizma-translate",
    title: chrome.i18n.getMessage("ctx_translate"),
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "aporizma-translate" || !info.selectionText) return;
  await chrome.storage.local.set({ pendingText: info.selectionText });
  chrome.windows.create({
    url: chrome.runtime.getURL("result.html"),
    type: "popup",
    width: 520,
    height: 560,
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status && changeInfo.status == "complete") {
        chrome.pageAction.show(tab.id);
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.pageAction.show(activeInfo.tabId);
});

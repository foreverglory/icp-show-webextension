var domain = "www.miitbeian.gov.cn";
var cookieName = "__jsl_clearance";

var tabId = null;
var building = false;

function buildCookie() {
    if (building) {
        return "busying";
    }
    building = true;
    chrome.cookies.get({
        url: "http://" + domain,
        name: cookieName,
    }, function(cookie) {
        if (cookie == null || parseInt(new Date().getTime() / 1000) >= cookie.expirationDate) {
            chrome.tabs.create({
                url: "http://www.miitbeian.gov.cn/icp/publish/query/icpMemoInfo_showPage.action",
                active: false
            }, function(tab) {
                building = false;
                tabId = tab.id;
                chrome.tabs.reload(tabId, {
                    bypassCache: true
                });
            });
        } else {
            building = false;
        }
    });
}

chrome.cookies.onChanged.addListener(function(changeInfo) {
    if (tabId && !changeInfo.removed) {
        if (changeInfo.cookie.domain == domain && changeInfo.cookie.name == cookieName) {
            chrome.tabs.remove(tabId, function() {
                tabId = null;
            });
        }
    }
});

chrome.windows.onCreated.addListener(buildCookie);

chrome.tabs.onCreated.addListener(buildCookie);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status && changeInfo.status == "complete") {
        chrome.pageAction.show(tab.id);
    }
});
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.pageAction.show(activeInfo.tabId);
});

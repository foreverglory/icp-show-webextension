function icpLog() {
    console.log.apply(this, arguments);
}

var icpDomain = "www.miitbeian.gov.cn";
var icpCookie = "__jsl_clearance";
//获取 ICP 网站 Cookie
function getOfficialCookie(callback) {
    chrome.cookies.get({
        url: "http://" + icpDomain,
        name: icpCookie,
    }, function(cookie) {
        icpLog("icp cookie get", cookie);
        //cookie存在，并且未过期
        if (cookie && parseInt(new Date().getTime() / 1000) <= cookie.expirationDate) {
            callback();
        } else {
            buildOfficialCookie(callback);
        }
    });
}

/**
 * 生成 ICP 网站 Cookie
 * 用于请求 www.miitbeian.gov.cn 网站，创建 Cookie `__jsl_clearance`，否则页面将返回 521。
 */
function buildOfficialCookie(callback) {
    chrome.tabs.create({
        url: "http://www.miitbeian.gov.cn/icp/publish/query/icpMemoInfo_showPage.action",
        active: false
    }, function(tab) {
        icpLog("icp tab created");
        //创建 tab 并不会直接打开，所以这里强制重新加载一遍
        chrome.tabs.reload(tab.id, {
            bypassCache: true
        }, function() {
            icpLog("icp tab reloaded");
        });

        //添加Cookie事件，获取cookie后，自动关闭icp官网标签页
        var cookieListener;
        cookieListener = function(changeInfo) {
            if (tab.id && !changeInfo.removed) {
                if (changeInfo.cookie.domain == icpDomain && changeInfo.cookie.name == icpCookie) {
                    chrome.tabs.remove(tab.id, function() {
                        icpLog("icp tab removed");
                        callback();
                    });
                    //移除Cookie事件
                    chrome.cookies.onChanged.removeListener(cookieListener);
                }
            }
        }
        chrome.cookies.onChanged.addListener(cookieListener);
    });
}

//请求官方数据
function requestOfficialData(domain, code, success, error) {
    if (!code) {
        return error(domain, "请输入验证码");
    }
    $.ajax("http://www.miitbeian.gov.cn/common/validate/validCode.action", {
        type: "POST",
        data: {
            validateValue: code
        },
        dataType: "json",
        success: function(data) {
            if (data.result) {
                $.post("http://www.miitbeian.gov.cn/icp/publish/query/icpMemoInfo_searchExecute.action", {
                    condition: "1",
                    siteName: "",
                    siteDomain: domain,
                    siteUrl: "",
                    mainLicense: "",
                    siteIp: "",
                    unitName: "",
                    mainUnitNature: "-1",
                    certType: "-1",
                    mainUnitCertNo: "",
                    verifyCode: code
                }, function(html) {
                    var table = $("table table", html);
                    var tr = $("tr:eq(1)", table);

                    var icp = {
                        'domain': domain,
                        'title': $("td:eq(1)", tr).text().trim(),
                        'type': $("td:eq(2)", tr).text().trim(),
                        'license': $("td:eq(3)", tr).text().trim(),
                        'name': $("td:eq(4)", tr).text().trim(),
                        'homepage': $("td:eq(5)", tr).text().trim(),
                        'audit': $("td:eq(6)", tr).text().trim(),
                        "source": "official"
                    };
                    saveICP(icp);
                    success(icp);
                });
            } else {
                error(domain, "验证码错误");
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            error(domain, "未知错误，请稍后再试");
        }
    });
}

//请求网络数据
function requestNetworkData(domain, success, faile) {
    var parts = domain.split(".");
    var url = "http://foreverglory.me/icp-data/domain/" + parts.slice(1).join(".") + "/" + parts[0] + ".json";
    $.ajax(url, {
        cache: false,
        timeout: 1000 * 60,
        dataType: "json",
        success: function(icp) {
            icp.source = "network";
            saveICP(icp);
            success(icp);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            faile(domain);
        }
    });
}

//请求本地数据
function requestLocalData(domain, success, faile) {
    chrome.storage.local.get(domain, function(result) {
        var icp = result[domain];
        if (icp) {
            success(icp);
        } else {
            faile(domain);
        }
    });
}

function saveICP(icp) {
    var storage = {};
    storage[icp.domain] = icp;
    chrome.storage.local.set(storage);
}

var ICP = Object;

function verifyCodeUrl() {
    return "http://www.miitbeian.gov.cn/getVerifyCode?" + parseInt(Math.random() * 100);
}

jQuery(function($) {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tabs) {
        var domain = window.urlDomain(tabs[0].url);
        window.getStorage(domain, function(icp) {
            renderICP(icp);
        }, function(domain) {
            renderSearch(domain);
        });
    });
});

function renderICP(icp) {
    $.each(icp, function(key, value) {
        $("#" + key).text(value);
    });
    $("#info").show();
    $("#search").hide();
    
}

function renderSearch(domain) {
    $("#verify-vode").attr("src", verifyCodeUrl()).on("click", function() {
        $(this).attr("src", verifyCodeUrl());
    });
    $("#submit").on("click", function() {
        var code = $("#code").val();
        $.post("http://www.miitbeian.gov.cn/common/validate/validCode.action", {
            validateValue: code
        }, function(data) {
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

                    var icp = new ICP({
                        'domain': domain,
                        'unitName': $("td:eq(1)", tr).text().trim(),
                        'unitType': $("td:eq(2)", tr).text().trim(),
                        'icp': $("td:eq(3)", tr).text().trim(),
                        'webName': $("td:eq(4)", tr).text().trim(),
                        'webHome': $("td:eq(5)", tr).text().trim(),
                        'verifyDate': $("td:eq(6)", tr).text().trim()
                    });
                    renderICP(icp);
                    window.saveStorage(domain, icp);
                })
            } else {
                alert("error");
            }
        }, "json");
    });
    $("#search").show();
    $("#info").hide();
}


window.urlDomain = function(url) {
    var host = url.split("/")[2];
    if (!host) {
        return '';
    }
    var tmp = host.split(".");
    var length = tmp.length;
    var domain = tmp.slice(length - 2).join(".");
    [
        "com.cn", "net.cn", "org.cn", "gov.cn", "com.hk", "com.tw", "com.co",
        "ac.cn", "bj.cn", "sh.cn", "tj.cn", "cq.cn", "he.cn", "sn.cn", "sx.cn", "nm.cn", "ln.cn", "jl.cn", "hl.cn", "js.cn", "zj.cn", "ah.cn", "fj.cn", "jx.cn", "sd.cn", "ha.cn", "hb.cn", "hn.cn", "gd.cn", "gx.cn", "hi.cn", "sc.cn", "gz.cn", "yn.cn", "gs.cn", "qh.cn", "nx.cn", "xj.cn", "tw.cn", "hk.cn", "mo.cn", "xz.cn"
    ].forEach(function(value) {
        if (value == domain) {
            return domain = tmp.slice(length - 3, length - 2) + "." + domain;
        }
    });
    return domain;
};

window.getStorage = function(name, success, failure = null) {
    chrome.storage.local.get(name, function(result) {
        if (result[name]) {
            success(result[name]);
        } else if (typeof failure == "function") {
            failure(name);
        }
    });
};

window.saveStorage = function(name, object, success = null) {
    var storage = {};
    storage[name] = object;
    chrome.storage.local.set(storage, success);
}

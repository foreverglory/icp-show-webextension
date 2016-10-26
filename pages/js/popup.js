function verifyCodeUrl() {
    return "http://www.miitbeian.gov.cn/getVerifyCode?" + parseInt(Math.random() * 100);
}

jQuery(function($) {
    $("#message").on("click", function(){
        $(this).hide();
    });

    renderLoader();
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tabs) {
        var host = getHost(tabs[0].url);
        if (host) {
            var domain = getDomain(host);
            chrome.storage.local.get(domain, function(result) {
                var icp = result[domain];
                if (icp) {
                    renderICP(icp, "local");
                } else {
                    $.ajax(domainDataUrl(domain), {
                        cache: true,
                        timeout: 1000 * 60,
                        dataType: "json",
                        success: function(icp) {
                            renderICP(icp, "network");
                            saveICP(icp);
                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                            renderSearch(domain);
                        }
                    });
                }
            });
        }
    });
});

function renderLoader(domain = ""){
    $("#loading").show();
}

function renderICP(icp, source = "local") {
    var $info = $("#info").hide();
    var $without = $("#without").hide();
    var $search = $("#search").hide();
    $("#loading").hide();

    if(icp.license){
        $.each(icp, function(key, value) {
            $("#" + key, $info).text(value);
        });
        $info.show();
    }else{
        $("#domain", $without).text(icp.domain);
        $("#try", $without).on("click", function(){
            renderSearch(icp.domain);
        });
        $without.show();
    }
}

function renderSearch(domain) {
    var $search = $("#search").show();
    var $message = $("#message").hide();
    $("#loading").hide();
    $("#info").hide();
    $("#without").hide();
    $("#domain", $search).html(domain);
    var $code = $("#code", $search);
    var $verify = $("#verify-code", $search).attr("src", verifyCodeUrl()).on("click", function() {
        $(this).attr("src", verifyCodeUrl());
    });
    var $submit = $("#submit", $search).on("click", function() {
        var code = $code.val();
        if(!code){
            $message.html("<span>请输入验证码</span>").show();
            return;
        }
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

                    var icp = {
                        'domain': domain,
                        'title': $("td:eq(1)", tr).text().trim(),
                        'type': $("td:eq(2)", tr).text().trim(),
                        'license': $("td:eq(3)", tr).text().trim(),
                        'name': $("td:eq(4)", tr).text().trim(),
                        'homepage': $("td:eq(5)", tr).text().trim(),
                        'audit': $("td:eq(6)", tr).text().trim(),
                        "source": "local"
                    };

                    renderICP(icp);
                    saveICP(icp);
                })
            } else {
                $message.html("<span>验证码错误</span>").show();
                //$verify.trigger("click");
            }
        }, "json");
    });
    $code.on("keyup", function(event){
        if(event.keyCode == 13){
            $submit.trigger("click");
        }
    });
}

function getHost(url) {
    return url.split("/")[2];
}

function getDomain(host) {
    var tops = [
        "com.cn", "net.cn", "org.cn", "gov.cn", "edu.cn", "com.hk", "com.tw", "com.co",
        "ac.cn", "bj.cn", "sh.cn", "tj.cn", "cq.cn", "he.cn", "sn.cn", "sx.cn", "nm.cn", "ln.cn", "jl.cn", "hl.cn", "js.cn", "zj.cn", "ah.cn", "fj.cn", "jx.cn", "sd.cn", "ha.cn", "hb.cn", "hn.cn", "gd.cn", "gx.cn", "hi.cn", "sc.cn", "gz.cn", "yn.cn", "gs.cn", "qh.cn", "nx.cn", "xj.cn", "tw.cn", "hk.cn", "mo.cn", "xz.cn"
    ];

    var parts = host.split(".");
    var length = parts.length;
    var domain = host;
    if (length > 2) {
        domain = parts.slice(length - 2).join(".");
        tops.forEach(function(top) {
            if (top == domain) {
                domain = parts.slice(length - 3, length - 2) + "." + domain;
                return domain;
            }
        });
    }
    return domain;
}

function domainDataUrl(domain) {
    var parts = domain.split(".");
    var name = parts[0];
    var top = parts.slice(1).join(".");
    return "http://foreverglory.me/icp-data/domain/" + top + "/" + name + ".json";
}

function saveICP(icp) {
    var storage = {};
    storage[icp.domain] = icp;
    chrome.storage.local.set(storage);
}

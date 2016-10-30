function verifyCodeUrl() {
    return "http://www.miitbeian.gov.cn/getVerifyCode?" + parseInt(Math.random() * 100);
}

(function($, render) {
    $(function($) {
        render($);
    });
})(jQuery, function($) {
    var domain;
    var $loading, $message, $info, $search;

    //loading init
    $loading = $("#loading").show();

    //message init
    $message = $("#message").on("click", function() {
        $(this).hide();
    }).hide();

    //search init
    $search = $("#search").hide();
    var $code = $("#code", $search);
    var $verify = $("#verify-code", $search).attr("src", verifyCodeUrl()).on("click", function() {
        $(this).attr("src", verifyCodeUrl());
    });
    var $submit = $("#submit", $search).on("click", function() {
        $loading.show();
        $search.hide();
        requestOfficialData(domain, $code.val(), function(icp) {
            renderICP(icp, "official");
        }, function(domain, msg) {
            message(msg, "error");
            $search.show();
            $loading.hide();
        });
    });
    $code.on("keyup", function(event) {
        if (event.keyCode == 13) {
            $submit.trigger("click");
        }
    });

    //info init
    $info = $("#info").hide();
    $("#try", $info).on("click", function() {
        renderSearch(domain);
    });

    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, function(tabs) {
        var host = getHost(tabs[0].url);
        if (host) {
            domain = getDomain(host);
            //本地数据
            requestLocalData(domain, function(icp) {
                renderICP(icp, "local");
            }, function(domain) {
                //网络数据
                requestNetworkData(domain, function(icp) {
                    renderICP(icp, "network");
                }, function(domain) {
                    //官方查询数据 面板
                    renderSearch(domain);
                });
            });
        } else {
            message("当前页面不可用", "info");
        }
    });

    function message(message, type = "info") {
        $message.show();
        $message.html("<span>" + message + "</span>");
        $loading.hide();
    }

    function renderICP(icp, source = "local") {
        console.log("render icp... source", source);
        $loading.show();

        if (icp.license) {
            $.each(icp, function(key, value) {
                $("#" + key, $info).text(value);
            });
        } else {
            $("#domain", $info).text(icp.domain);
            $("#license", $info).text("未备案");
        }
        $info.show();

        $search.hide();
        $message.hide();
        $loading.hide();
    }

    function renderSearch(domain) {
        $loading.show();
        getOfficialCookie(function() {
            $search.show();
            $("#without").hide();
            $("#domain", $search).html(domain);

            $info.hide();
            $message.hide();
            $loading.hide();
        });
    }

});



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

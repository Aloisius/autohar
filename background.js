var connections = {};
var har_log = {};
var settings = {};

chrome.storage.local.get({
    save_blocked: false,
    save_images: true,
    save_fonts: true,
    save_css: true,
    save_tab_close: true,
    save_navigation: false,
    max_entries: 100
}, function (items) {
    settings = items;

    var tabs = Object.keys(connections);
    for (var i=0, len=tabs.length; i < len; i++) {
        connections[tabs[i]].postMessage({
            cmd: 'settings',
            settings: settings
        });
    }
});

function download(dataURI, tries=0) {
    chrome.downloads.download({
        url: dataURI,
        filename: `archive - ${Date.now() - 1544144717841}.har`,
        conflictAction: "uniquify",
        saveAs: false
    }, function(downloadId) {
        if (chrome.runtime.lastError) {
            console.error("Got lastError: ", chrome.runtime.lastError);
        }
        console.log("Download", downloadId);
    });
}

function saveHAR(port) {
    if (!har_log[port].length) {
        return;
    }

    var har = {
        log: {
            version: '1.2',
            creator: {
                name: "WebInspector",
                version: "537.36"
            },
            pages: [],
            entries: har_log[port]
        }
    };

    const dataURI = "data:application/json;base64," + JSON.stringify(har, null, 2).toBase64();
    har_log[port] = [];
    download(dataURI);
}

function addRequest(port, request) {
    const content = request.response.content;
    if (content.size > 0) {
        if (content.text && !content.encoding && needsEncoding(content.text)) {
            // console.log("needs encoding!", content.text)
            request.response.content.text = content.text.toBase64();
            request.response.content.encoding = 'base64';
        }
    }
    har_log[port].push(request);
}

chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected to devtools");
    har_log[port] = [];

    port.postMessage({
        cmd: 'settings',
        settings: settings
    });

    const listener = function(message, sender, sendResponse) {
        // console.log("Got message", message);

        switch(message.cmd) {
        case 'init':
            console.log("Tab init", message.tabId, port)
            connections[message.tabId] = port;
            break;
        case 'request_finished':
            // console.log("got request finished: ", message.request)
            addRequest(port, message.request)
            break;
        case 'navigated':
            // console.log("got navigated: ", message.url)
            if (settings.save_navigation ||
                (port in har_log && har_log[port].length >= settings.max_entries && settings.max_entries > 0)) {
                saveHAR(port);
            }
            break;
        }
    }

    port.onMessage.addListener(listener);

    port.onDisconnect.addListener(function() {
        console.log("Disconnected from devtools");
        if (settings.save_tab_close) {
            saveHAR(port);
        }
        port.onMessage.removeListener(listener);

        var tabs = Object.keys(connections);
        for (var i=0, len=tabs.length; i < len; i++) {
          if (connections[tabs[i]] == port) {
            delete connections[tabs[i]]
            break;
          }
        }
    });
});



chrome.storage.onChanged.addListener((changes, storageType) => {
    console.log("onChanged", changes);

    for (key in changes) {
        var storageChange = changes[key];
        settings[key] = changes[key].newValue;
    }

    var tabs = Object.keys(connections);
    for (var i=0, len=tabs.length; i < len; i++) {
        connections[tabs[i]].postMessage({
            cmd: 'settings',
            settings: settings
        });
    }
});


String.prototype.toBase64 = function () {
    /**
     * @param {number} b
     * @return {number}
     */
    function encodeBits(b) {
        return b < 26 ? b + 65 : b < 52 ? b + 71 : b < 62 ? b - 4 : b === 62 ? 43 : b === 63 ? 47 : 65;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(this.toString());
    const n = data.length;
    let encoded = '';
    if (n === 0)
        return encoded;
    let shift;
    let v = 0;
    for (let i = 0; i < n; i++) {
        shift = i % 3;
        v |= data[i] << (16 >>> shift & 24);
        if (shift === 2) {
            encoded += String.fromCharCode(
                encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), encodeBits(v & 63));
            v = 0;
        }
    }
    if (shift === 0)
        encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), 61, 61);
    else if (shift === 1)
        encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), 61);
    return encoded;
};

function isValidCharacter(code_point) {
    // Excludes non-characters (U+FDD0..U+FDEF, and all codepoints ending in
    // 0xFFFE or 0xFFFF) from the set of valid code points.
    return code_point < 0xD800 || (code_point >= 0xE000 && code_point < 0xFDD0) ||
        (code_point > 0xFDEF && code_point <= 0x10FFFF && (code_point & 0xFFFE) !== 0xFFFE);
}

function needsEncoding(content) {
    for (let i = 0; i < content.length; i++) {
      if (!isValidCharacter(content.charCodeAt(i)))
        return true;
    }

    return false;
}
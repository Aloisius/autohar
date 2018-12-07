const trace = {
    log: function(...args) {
        const escaped = args.map(JSON.stringify).join(",");
        chrome.devtools.inspectedWindow.eval(`console.log(${escaped});`);
    },
};

var settings = {
    save_blocked: false,
    save_images: true,
    save_fonts: true,
    save_css: true,
    save_tab_close: true,
    save_navigation: false,
    max_entries: 100
};

var bg = chrome.runtime.connect({
    name: "autoHAR"
});

bg.postMessage({
    cmd: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});


bg.onMessage.addListener(function (message) {
    // Handle responses from the background page, if any
    trace.log("devtools got message from bg", message)
    switch(message.cmd) {
        case 'settings':
            console.log("got settings", message);
            settings = message.settings;
            break;
        }
});

chrome.devtools.network.onRequestFinished.addListener(function(request) {
    // trace.log("requestFinished", request);

    if (!settings.save_blocked && request.response.status == 0) {
        return;
    }

    const mimeType = request.response.content.mimeType;
    if (!settings.save_css && mimeType.startsWith('text/css')) {
        return;
    }

    if (!settings.save_img && mimeType.startsWith('image/')) {
        return;
    }

    if (!settings.save_font && mimeType.startsWith('font/')) {
        return;
    }


    if (request.response.content.size > 0) {
        request.getContent((content, encoding) => {
            //trace.log("In getContent", request, content, encoding);

            if (chrome.runtime.lastError) {
                trace.log(chrome.runtime.lastError);
            }

            if (content) {
                delete request.response.content.comment;
                request.response.content.text = content;

                if (encoding) {
                    request.response.content.encoding = encoding;
                }
            }

            bg.postMessage({
                cmd: 'request_finished',
                request: request
            });
        });
    } else {
        bg.postMessage({
            cmd: 'request_finished',
            request: request
        });
    }
});

chrome.devtools.network.onNavigated.addListener(function(url) {
    ///trace.log("navigated", url);

    bg.postMessage({
        cmd: 'navigated',
        url: url
    });
});
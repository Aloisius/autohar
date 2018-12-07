function save_options() {
    const save_blocked = document.getElementById('save_blocked').checked;
    const save_images = document.getElementById('save_images').checked;
    const save_fonts = document.getElementById('save_fonts').checked;
    const save_css = document.getElementById('save_css').checked;
    const save_tab_close = document.getElementById('save_tab_close').checked;
    const save_navigation = document.getElementById('save_navigation').checked;
    const max_entries = parseInt(document.getElementById('max_entries').value);

    chrome.storage.local.set({
        save_blocked: save_blocked,
        save_images: save_images,
        save_fonts: save_fonts,
        save_css: save_css,
        save_tab_close: save_tab_close,
        save_navigation: save_navigation,
        max_entries: max_entries
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';

        console.log("Save?");
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.local.get({
        save_blocked: false,
        save_images: true,
        save_fonts: true,
        save_css: true,
        save_tab_close: true,
        save_navigation: false,
        max_entries: 100
    }, function (items) {
        document.getElementById('save_blocked').checked = items.save_blocked;
        document.getElementById('save_images').checked = items.save_images;
        document.getElementById('save_fonts').checked = items.save_fonts;
        document.getElementById('save_css').checked = items.save_css;
        document.getElementById('save_tab_close').checked = items.save_tab_close;
        document.getElementById('save_navigation').checked = items.save_navigation;
        document.getElementById('max_entries').value = items.max_entries;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
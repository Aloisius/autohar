# AutoHAR

This is a simple devtools extension for Chrome that will save a HAR file to your downloads folder as you browse around.

## Getting Started

Once installed, the extension will start saving HAR files for any browser tabs with devtools open.

This extension was not built for automation in mind.

### Settings

The extension option page has some basic options about what to save.

Everything but blocked requests are saved by default and HAR files are only saved when a tab is closed or after navigating if there are over 100 entries queued.

### Running Chrome

If you want to ensure devtools is open for every new tab, start Chrome from the command line with the --auto-open-devtools-for-tabs flag.

On MacOS:

```
$ /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --auto-open-devtools-for-tabs
```

### Caveats

Devtools seems to slow down the browser enough that you probably don't want to keep this enabled all the time.

Opening new tabs with the --auto-open-devtools-for-tabs option seems to switch focus to that tab immediately.

HAR files do not contain the 'page' key with timing.

This extension is mostly just for my own use and may tear a hole in the fabric of reality for anyone else (or crash Chrome). Use at your own risk.
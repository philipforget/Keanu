#Keanu!

Keanu is a simple javascript keychording library for capturing multiple,
simultaneous keyboard events. Useful for catching system-like shortcuts like
`Control-Shift-c`.


## Examples

Setting a shortcut is useful for UI where the user wants to record a new
shortcut to be listened for.

```javascript
// First create a shortcut to be listened to
keanu.get_shortcut({
    max_keys: 4,
    // Every time pressed keys are changed, on_update will be triggered
    on_update: function (shortcut) {
        if (shortcut) {
            console.log("Shortcut updated to " + shortcut);
        }
    },
    // When the final shortcut is set, on_set will be triggered
    on_set: function (shortcut) {
        if (shortcut) {
            console.log("Shortcut set to " + shortcut);
        }
    },
    // Regardless of the shortcut being set or canceled, on_complete will be triggered last.
    on_complete: function () {
        console.log("All done here");
    }
});
```


It's even simpler if you just want to listen for keanu-style shortcut events.
Here's the code to set up a global listener.

```javascript
keanu.listen(function (shortcut) {
    if (shortcut == "16_17_67") {
        console.log("It's happening!");
    }
});
```

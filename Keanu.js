Keanu = (function () {
    var MODIFIERS = [
            '16', // Shift
            '17', // Ctrl
            '18', // Alt
            '91', // Command
            '92'  // Meta
        ],
        // Cancel if these are pressed
        CANCEL_ON = [
            '27', // Escape
            '8',  // Backspace
            '46'  // Delete
        ],
        // Special character transforms for displaying properly
        TRANSFORMS = {
            112: 'F1',
            113: 'F2',
            114: 'F3',
            115: 'F4',
            116: 'F5',
            117: 'F6',
            118: 'F7',
            119: 'F8',
            120: 'F9',
            121: 'F10',
            122: 'F11',
            123: 'F12',
            13:  'Enter',
            16:  'Shift',
            17:  'Ctrl',
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            18:  'Alt',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: "'",
            32:  'Space',
            37:  'Left',
            38:  'Up',
            39:  'Down',
            40:  'Right',
            91:  'Cmd',
            92:  'Meta'
        };

    // Add the reverse transform relationships
    for(var transform_key in TRANSFORMS){
        if(TRANSFORMS.hasOwnProperty(transform_key)){
            TRANSFORMS[TRANSFORMS[transform_key]] = transform_key;
        }
    }

    function len(obj){
        if(obj.length){
            return obj.length;
        }
        else if(Object.keys){
            return Object.keys(obj).length;
        }
        else {
            var return_length = 0, key;
            for(key in obj){
                if(obj.hasOwnProperty(key)){
                    return_length += 1;
                }
            }
            return return_length;
        }
    }


    function transform_which(which){
        return TRANSFORMS[which] || String.fromCharCode(which);
    }


    // Sort an array of which entities
    function sort_which(which_array){
        which_array.sort(function(a, b){
            if(
                // Both modifiers
                (MODIFIERS.indexOf(String(a)) !== -1 && MODIFIERS.indexOf(String(b)) !== -1) ||
                // Both not modifiers
                (MODIFIERS.indexOf(String(a)) === -1 && MODIFIERS.indexOf(String(b)) === -1)
            ){
                return 0;
            }
            // A is modifier
            else if(MODIFIERS.indexOf(String(a)) !== -1){
                return -1;
            }

            // Last case is that B is a modifier
            return 1;
        })

        return which_array
    }


    // Transform a key hash map to a sorted shortcut string
    function keymap_to_shortcut(keymap){
        if(typeof keymap === 'undefined' || keymap === {}){
            return;
        }

        var key_array = [],
            key, key_index;

        for(var key_index in keymap){
            key = keymap[key_index];
            if(keymap.hasOwnProperty(key_index)){
                key_array.push(key.which);
            }
        }

        return sort_which(key_array).map(function(elem){
            return transform_which(elem);
        }).join('+');
    }


    // Handle the actual dispatching of events
    function dispatch_update(callback, keymap, event){
        if(len(keymap) && typeof(callback) !== 'undefined'){
            callback(keymap_to_shortcut(keymap), format_keymap(keymap), event);
        }
    }


    // Given a shortcut string, return a shortcut array
    function shortcut_to_keymap(shortcut){
        var keys = shortcut.split('+'),
            return_keymap = {},
            key_index, key, charcode;

        for(key_index in keys){
            if(keys.hasOwnProperty(key_index)){
                key = keys[key_index];
                charcode = TRANSFORMS[key] || key.charCodeAt(0);
                return_keymap[charcode] = {
                    which: charcode
                }
            }
        }

        return format_keymap(return_keymap);
    }


    function format_keymap(keymap){
        var key_array = [],
            key_index, key;

        for(var key_index in keymap){
            if(keymap.hasOwnProperty(key_index)){
                key = keymap[key_index];
                key_array.push({
                    'which': key.which,
                    'is_modifier': MODIFIERS.indexOf(String(key.which)) >= 0 ? true: false,
                    'display': transform_which(key.which)
                })
            }
        }

        key_array.sort(function(a, b){
            if(
                // Both modifiers
                (a.is_modifier && b.is_modifier) ||
                // Both not modifiers
                (!a.is_modifier && !b.is_modifier)
            ){
                return 0;
            }
            // A is modifier
            else if(a.is_modifier){
                return -1;
            }
            // Last case is that B is a modifier
            return 1;
        })

        return key_array;
    }


    // Listen for new shortcuts being set
    function get_shortcut(options, doc) {
        var // Internal tracking of keys pressed
            keys_pressed  = {},
            // What to attach key events to
            doc = typeof doc === 'undefined' ? window : doc;
            // Options
            max_keys = typeof(options.max_keys) === 'undefined' ? 0 : options.max_keys,
            // 
            CLEANUP_DELAY = 200;

        function keydown_listener(event){
            var which = event.which;

            // Swallow up the key events
            event.preventDefault();
            event.stopImmediatePropagation();

            // tear_down on these characters
            if(CANCEL_ON.indexOf(String(which)) != -1){
                return cancel();
            }

            if(
                (!max_keys || len(keys_pressed) < max_keys) &&
                (keys_pressed[which] === undefined || keys_pressed[which].active === false)
            ){
                keys_pressed[which] = {which: which, active: true}; 
                dispatch_update(options.on_update, keys_pressed, event);
            }
        }


        function keyup_listener(event){
            event.preventDefault();
            var which = event.which;

            // Short circuit on command key release or else the keyup function
            // of the other keys wont ever fire.
            if(which === 91){
                return set_shortcut();
            }

            if(keys_pressed[which]){
                keys_pressed[which].active = false;
                setTimeout(remove_inactive_keypress, CLEANUP_DELAY, which);
                for(var press_index in keys_pressed){
                    // If any of the keys are still pressed, keep listening
                    if(keys_pressed[press_index].active){
                        return;
                    }
                }
                set_shortcut();
            }
        }


        // After CLEANUP_DELAY, remove the key based on the keycode if it
        // exists and is inactive.
        function remove_inactive_keypress(which){
            if(keys_pressed[which] && keys_pressed[which].active === false){
                delete keys_pressed[which];
                dispatch_update(options.on_update, keys_pressed, event);
            }
        }


        function has_non_modifier(keys_pressed){
            for(var which in keys_pressed){
                if(MODIFIERS.indexOf(which) === -1){
                    return true;
                }
            }
            return false;
        }


        function set_shortcut(){
            if(!has_non_modifier(keys_pressed)){
                keys_pressed = {};
            }
            tear_down();
        }


        // Cancel everything
        function cancel(event){
            if(event){
                event.preventDefault();
                event.stopPropagation();
            }
            keys_pressed = {};
            tear_down();
        }


        function tear_down(){
            if(len(keys_pressed) && options.on_set){
                dispatch_update(options.on_set, keys_pressed, event);
            }

            // Setting this to an empty object keeps any queued up cleanup
            // events from firing
            keys_pressed = {};

            // Stop listeners
            doc.removeEventListener('keydown', keydown_listener);
            doc.removeEventListener('keyup', keyup_listener);
            doc.removeEventListener('mousedown', cancel);
            doc.removeEventListener('blur', cancel);
            doc.removeEventListener('focus', cancel);

            if(options.on_complete){
                options.on_complete();
            }
        }


        // Init
        doc.addEventListener('keydown', keydown_listener, false);
        doc.addEventListener('keyup', keyup_listener, false);
        doc.addEventListener('mousedown', cancel, false);

        // Entering or leaving the doc should cancel anything going on
        doc.addEventListener('blur', cancel, false);
        doc.addEventListener('focus', cancel, false);
    }


    function listen(callback, doc){
        var keys_pressed = {},
            doc = typeof doc === 'undefined' ? window : doc;

        function keydown_listener(event){
            if(
                !event.target ||
                event.target.tagName == 'BODY' ||
                event.target.tagName == 'HTML' ||
                event.target.tagName == 'html' ||
                event.target == document.documentElement
            ){
                var which = event.which;

                // Tear_down on these characters
                if(CANCEL_ON.indexOf(String(which)) != -1){
                    return cancel();
                }

                if(keys_pressed[which] === undefined || keys_pressed[which].active === false){
                    keys_pressed[which] = {which: which, active: true};
                    dispatch_update(callback, keys_pressed, event);
                }
            }
        }


        function keyup_listener(event){
            var which = event.which;
            delete keys_pressed[which];
            dispatch_update(callback, keys_pressed, event);
        }


        function cancel(){
            keys_pressed = {};
            return true;
        }


        function stop(){
            keys_pressed = {};

            doc.removeEventListener('keydown', keydown_listener, true);
            doc.removeEventListener('keyup', keyup_listener, true);

            doc.removeEventListener('blur', cancel);
            doc.removeEventListener('focus', cancel);
        }

        doc.addEventListener('keydown', keydown_listener, true);
        doc.addEventListener('keyup', keyup_listener, true);
        // Entering and leaving the doc should cancel any active presses
        doc.addEventListener('blur', cancel, true);
        doc.addEventListener('focus', cancel, true);

        return {
            stop: stop
        };
    }


    return {
        listen: listen,
        get_shortcut: get_shortcut,
        shortcut_to_keymap: shortcut_to_keymap
    };
}());

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


    // Transform a key hash map to a sorted shortcut
    function key_map_to_shortcut(key_map){
        if(typeof key_map === 'undefined' || key_map === {}){
            return;
        }

        var key_array = [],
            key_index;

        for(var key_index in key_map){
            if(key_map.hasOwnProperty(key_index)){
                key_array.push(key_map[key_index].event.which);
            }
        }


        return sort_which(key_array).map(function(elem){
            return transform_which(elem);
        }).join('+');
    }


    function key_map_to_key_array(key_map){
        var key_array = [],
            key_index, key;

        for(var key_index in key_map){
            if(key_map.hasOwnProperty(key_index)){
                key = key_map[key_index];
                key_array.push({
                    'which': key.event.which,
                    'is_modifier': MODIFIERS.indexOf(String(key.event.which)) >= 0 ? true: false,
                    'display': transform_which(key.event.which)
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
    function get_shortcut(options) {
        var keys_pressed  = {},
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
                keys_pressed[which] = {event: event, active: true}; 
                dispatch_update();
            }
        }

        function dispatch_update(){
            if(len(keys_pressed) && options.on_update){
                options.on_update(key_map_to_shortcut(keys_pressed), key_map_to_key_array(keys_pressed));
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
                dispatch_update();
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
                options.on_set(key_map_to_shortcut(keys_pressed), key_map_to_key_array(keys_pressed));
            }

            // Setting this to an empty object keeps any queued up cleanup
            // events from firing
            keys_pressed = {};

            // Stop listeners
            window.removeEventListener('keydown', keydown_listener);
            window.removeEventListener('keyup', keyup_listener);
            window.removeEventListener('mousedown', cancel);
            window.removeEventListener('blur', cancel);
            window.removeEventListener('focus', cancel);

            if(options.on_complete){
                options.on_complete();
            }
        }

        // Init
        window.addEventListener('keydown', keydown_listener, false);
        window.addEventListener('keyup', keyup_listener, false);
        window.addEventListener('mousedown', cancel, false);

        // Entering or leaving the window should cancel anything going on
        window.addEventListener('blur', cancel, false);
        window.addEventListener('focus', cancel, false);
    }

    function listen(callback){
        var keys_pressed = {};

        function dispatch_keychord(event){
            if(len(keys_pressed)){
                callback(key_map_to_shortcut(keys_pressed), key_map_to_key_array(keys_pressed), event);
            }
        }

        function keydown_listener(event){
            if(
                !event.target ||
                event.target.tagName == 'BODY' ||
                event.target.tagName == 'HTML' ||
                event.target == document.documentElement
            ){
                var which = event.which;

                // Tear_down on these characters
                if(CANCEL_ON.indexOf(String(which)) != -1){
                    return cancel();
                }

                if(keys_pressed[which] === undefined || keys_pressed[which].active === false){
                    keys_pressed[which] = {event: event, active: true};
                    dispatch_keychord(event);
                }
            }
        }

        function keyup_listener(event){
            var which = event.which;
            delete keys_pressed[which];
            dispatch_keychord(event);
        }

        function cancel(){
            keys_pressed = {};
            return true;
        }

        function stop(){
            keys_pressed = {};
            window.removeEventListener('keydown', keydown_listener, true);
            window.removeEventListener('keyup', keyup_listener, true);
        }

        window.addEventListener('keydown', keydown_listener, true);
        window.addEventListener('keyup', keyup_listener, true);

        // Entering and leaving the window should cancel any active presses
        window.addEventListener('blur', cancel, true);
        window.addEventListener('focus', cancel, true);

        return {
            stop: stop
        };
    }

    return {
        listen       : listen,
        get_shortcut : get_shortcut
    };
}());

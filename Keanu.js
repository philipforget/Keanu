Keanu = (function () {
    var MODIFIERS = [
            16, // Shift
            17, // Ctrl
            18, // Alt
            91, // Command
            92  // Meta
        ],
        // Special character transforms for displaying properly
        TRANSFORMS = {
            32:  'Space',
            37:  '&larr;', // Left arrow
            38:  '&uarr;', // Up arrow
            39:  '&rarr;', // Right arrow
            40:  '&darr;', // Down arrow
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
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: "'"
        };
    if(get_os() === "darwin"){
        var darwin_transforms = {
            13: '&#x21b5', // Enter
            16: '&#x21E7', // Shift
            17: '&#x2303', // Ctrl
            18: '&#x2325', // Alt
            32: '&#x2423'  // Space
        };

        // Merge the transforms
        for(var key in darwin_transforms){
            if(darwin_transforms.hasOwnProperty(key)){
                TRANSFORMS[key] = darwin_transforms[key];
            }
        }
    }

    function render_which(which){
        return TRANSFORMS[which] || String.fromCharCode(which);
    }

    function get_os(){
        var oses = {
                'Win'  : 'windows',
                'Mac'  : 'darwin',
                'Linux': 'linux',
                'X11'  : 'unix'
            },
            os = 'unknown';
        for (var os_key in oses){
            if(navigator.appVersion.indexOf(os_key) != -1){
                os = oses[os_key];
                break;
            }
        }
        return os;
    }

    function key_dict_to_string(key_dict){
        var temp_array    = [],
            return_string = "",
            key_index;

        for(var key in key_dict){
            if(key_dict.hasOwnProperty(key)){
                temp_array.push(key);
            }
        }

        temp_array.sort();

        for(key_index = 0; key_index < temp_array.length; key_index++){
            return_string += temp_array[key_index];
            if(key_index < temp_array.length - 1){
                return_string += '_';
            }
        }
        return return_string;
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

    // Listen for new key chords being set
    function get_key_array(options) {
        var keys_pressed  = {},
            // Options
            max_keys = typeof(options.max_keys) === 'undefined' ? 0 : options.max_keys,
            // 
            CLEANUP_DELAY = 200;

        function keydown_listener(event){
            event.preventDefault();
            event.stopImmediatePropagation();
            var which = event.which;

            // tear_down on these characters
            if(
                which === 27 || // Escape
                which === 8  || // Backspace
                which === 46    // Delete
            ){
                cancel();
                return;
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
            options.on_update(keys_pressed === {} ? false : key_dict_to_string(keys_pressed));
        }

        function keyup_listener(event){
            event.preventDefault();
            var which = event.which;
            // Short circuit on command key release or else the keyup function
            // of the other keys wont ever fire.
            if(which === 91){
                set_shortcut();
                return;
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

        // After CLEANUP_DELAY, remove the key based on the keycode if it exists and is inactive
        function remove_inactive_keypress(which){
            if(keys_pressed[which] && keys_pressed[which].active === false){
                delete keys_pressed[which];
                dispatch_update();
            }
        }

        function set_shortcut(){
            // Verify that we have at least one non-modifier and any optional modifiers
            var has_modifier     = false,
                has_non_modifier = false;

            // Convert the key hash to an array
            for(var which in keys_pressed){
                if(MODIFIERS.indexOf(which) >= 0){
                    has_modifier = true;
                }
                else {
                    has_non_modifier = true;
                }
            }

            // Invalid keys_pressed
            if(!has_non_modifier){
                keys_pressed = {};
            }

            tear_down();
        }

        function cancel(event){
            if(event){
                event.preventDefault();
                event.stopPropagation();
            }
            keys_pressed = {};
            tear_down();
        }

        // Shut. Down. Everything
        function tear_down(){
            if(options.on_set){
                options.on_set(keys_pressed === {} ? false : key_dict_to_string(keys_pressed));
            }

            // Setting this to an empty object keeps any queued up cleanup
            // events from firing
            keys_pressed = {};

            // Stop listeners
            window.removeEventListener('keydown', keydown_listener);
            window.removeEventListener('keyup', keyup_listener);
            window.removeEventListener('mousedown', cancel);

            if(options.on_complete){
                options.on_complete();
            }
        }

        // Init
        window.addEventListener('keydown', keydown_listener, false);
        window.addEventListener('keyup', keyup_listener, false);
        window.addEventListener('mousedown', cancel, false);
    }

    function listen ( callback ) {
        var keys_pressed = {};

        function dispatch_keychord(event){
            if(keys_pressed !== {}){
                callback(key_dict_to_string(keys_pressed), event);
            }
        }

        function keydown_listener(event){
            var which = event.which;

            if(which === 27){ // Cancel on escape
                keys_pressed = {}; 
                return;
            }

            if(keys_pressed[which] === undefined || keys_pressed[which].active === false){
                keys_pressed[which] = {event: event, active: true};
                dispatch_keychord(event);
            }
        }

        function keyup_listener(event){
            var which = event.which;
            delete keys_pressed[which];
            dispatch_keychord(event);
        }

        function stop(){
            keys_pressed = {};
            window.removeEventListener('keydown', keydown_listener, true);
            window.removeEventListener('keyup', keyup_listener, true);
        }

        window.addEventListener('keydown', keydown_listener, true);
        window.addEventListener('keyup', keyup_listener, true);

        return {
            stop: stop
        };
    }

    return {
        listen        : listen,
        get_key_array : get_key_array
    };

}());

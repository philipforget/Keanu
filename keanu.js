keanu = (function(){
    var global_keys_pressed  = {},
        keystring_callbacks = [],
        os = get_os(),
        //
        MODIFIERS = {
            16: os === 'darwin' ? '&#x21E7' : 'Shift',
            17: os === 'darwin' ? '&#x2303' : 'Ctrl',
            18: os === 'darwin' ? '&#x2325' : 'Alt',
            91: '&#x2318', // Command
            92: 'Meta'
        },
        // Special character transforms for displaying
        TRANSFORMS = {
            32: os === 'darwin' ? '&#x2423' : 'Space',
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
            13:  os === 'darwin' ? '&#x21b5' : 'Enter',
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
            222: '\''
        },
        //
        global_teardown_timeout;

    function get_os(){
        var oses = {
            'Win'   : 'windows',
            'Mac'   : 'darwin',
            'Linux' : 'linux',
            'X11'   : 'unix'
        };
        for (var os_key in oses){
            if(navigator.appVersion.indexOf(os_key) != -1){
                return oses[os_key];
            }
        }
        return 'unknown';
    }

    function global_keydown_listener(event){
        var which = event.which;
        // Cancel on escape or tab
        if(which === 27 || which === 9){
            global_keys_pressed = {}; 
            return;
        }
        else if(global_keys_pressed[which] === undefined || global_keys_pressed[which].active === false){
            global_keys_pressed[which] = {event: event, active: true};
            dispatch_keystring(event);

            clearTimeout(global_teardown_timeout);
            global_teardown_timeout = setTimeout(global_teardown, 3000);
        }
    }

    function global_teardown(){
        global_keys_pressed = {};
    }

    function global_keyup_listener(event){
        var which = event.which;
        delete global_keys_pressed[which];
        // Only dispatch constructive events
        // dispatch_keystring(event);
    }

    function key_dict_to_string(key_dict){
        var temp_array    = [],
            return_string = "",
            key_index;

        if(key_dict === {}){
            return false;
        }

        for(var key in key_dict){
            if(key_dict.hasOwnProperty(key)){
                temp_array.push(key);
            }
        }

        temp_array.sort();

        return temp_array.join("_");
    }

    // Publish keystring events
    function dispatch_keystring(event){
        var keystring = key_dict_to_string(global_keys_pressed),
            i;

        if(keystring){
            for(i = 0; i < keystring_callbacks.length; i++){
                keystring_callbacks[i](event, key_dict_to_string(global_keys_pressed));
            }
        }
    }

    function obj_len(obj){
        if(Object.keys){
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

    // Listen for new shortcuts
    function listen(options){
        var keys_pressed  = {},
            //
            max_keys = typeof(options.max_keys) === 'undefined' ? 0 : options.max_keys,
            // 
            CLEANUP_DELAY = 200;

        // Start the listeners
        $(document).bind('keydown', keydown_listener);
        $(document).bind('keyup', keyup_listener);
        $(document).bind('mousedown', cancel);

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
                (!max_keys || obj_len(keys_pressed) < max_keys) &&
                (keys_pressed[which] === undefined || keys_pressed[which].active === false)
            ){
                keys_pressed[which] = {event: event, active: true}; 
                dispatch_update();
            }
        }

        // Dispatch the keystring to the on_update callback
        function dispatch_update(){
            if(options.on_update){
                options.on_update(keys_pressed === {} ? false : key_dict_to_string(keys_pressed));
            }
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
                if(MODIFIERS[which]){
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
            // Trap the global mousedown event
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
            $(document).unbind('keydown', keydown_listener);
            $(document).unbind('keyup', keyup_listener);
            $(document).unbind('mousedown', cancel);

            if(options.on_complete){
                options.on_complete();
            }
        }
    }

    // Add keystring event subscribers
    function add_keystring_listener(callback){
        keystring_callbacks.push(callback);
    }

    function add_global_listeners(){
        window.addEventListener('keydown', global_keydown_listener, true);
        window.addEventListener('keyup', global_keyup_listener, true);
    }

    function remove_global_listeners(){
        window.removeEventListener('keydown', global_keydown_listener, true);
        window.removeEventListener('keyup', global_keyup_listener, true);
    }

    function init(){
        add_global_listeners();
    }

    return  {
        init: init,
        add_keystring_listener: add_keystring_listener,
        listen: listen,
        MODIFIERS: MODIFIERS,
        TRANSFORMS: TRANSFORMS
    };
}());

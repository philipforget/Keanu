var keanu;

(function (exports) {
    // CommonJS
    if (typeof module !== "undefined" && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === "function") {
        define(exports);
    }
    // <script>
    else {
        keanu = exports;
    }
}((function () {
    var exports = {};

    exports.name = 'keanu.js';
    exports.version = '0.3';

    var MODIFIERS = [
            '17', 'Ctrl',
            '224', 'Cmd'
        ],
        // Cancel if these are pressed
        CANCEL_ON = [
            '0',  // Escape
            '27', // Escape
            '8',  // Backspace
            '46'  // Delete
        ],
        // Special character transforms for displaying properly
        TRANSFORMS = {
            16: 'Shift',
            17: 'Ctrl',
            18: 'Alt',
            28:  '\\',
            32:  'Space',
            92:  'Win',
            224: 'Cmd'
        },
        //
        browser_is_webkit = navigator.appVersion.indexOf('Chrome') !== -1;

    // Webkit browsers report some funky characters for non-ascii characters
    if(browser_is_webkit){
        var webkit_transforms = {
            13:  'Enter',
            37:  'Left',
            38:  'Up',
            39:  'Down',
            40:  'Right',
            91:  'Cmd',
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

        // Merge the transforms
        for(var key in webkit_transforms)
            TRANSFORMS[key] = webkit_transforms[key];

        MODIFIERS.push('16');
        MODIFIERS.push('Shift');
        //
        MODIFIERS.push('18');
        MODIFIERS.push('Alt');
    }

    // Add the reverse transform relationships
    for(var transform_key in TRANSFORMS){
        if(TRANSFORMS.hasOwnProperty(transform_key)){
            TRANSFORMS[TRANSFORMS[transform_key]] = transform_key;
        }
    }


    // Test whether a key which is a modifier
    function is_modifier(which){
        return (
            MODIFIERS.indexOf(which) !== -1 ||
            MODIFIERS.indexOf(String(which)) !== -1
        );
    }


    function transform_which(which){
        return TRANSFORMS[which] || String.fromCharCode(Number(which));
    }


    // Sort an array of which entities
    function sort_which(a, b){
        if( is_modifier(a) === is_modifier(b) ){
            return a - b;
        }

        // A is modifier
        else if(is_modifier(a)){
            return -1;
        }

        // Last case is that B is a modifier
        return 1;
    }


    // Transform a key hash map to a sorted shortcut string
    function keyarray_to_shortcut(keyarray){
        if(typeof keyarray === 'undefined' || keyarray.length === 0){
            return;
        }

        return keyarray.sort(sort_which).join('_');
    }


    // Given a shortcut string, return a shortcut array
    function shortcut_to_keyarray(shortcut){
        return shortcut.split('_').map(function(elem){
            return String(elem);
        }).sort(sort_which);
    }


    // Handle the actual dispatching of events
    function dispatch_update(callback, keyarray){
        if(typeof(callback) !== 'undefined'){
            callback(
                keyarray.length ? keyarray_to_shortcut(keyarray) : false
            );
        }
    }

    function has_non_modifier(keyarray){
        for(var i = 0; i < keyarray.length; i++){
            if(!is_modifier(keyarray[i])){
                return true;
            }
        }
        return false;
    }


    // Determine if a key event should be considered valid
    function validate_event(event){
        var which = String(event.which);

        if (
            (   // Keydown events from firefox are used to capture modifier
                // keys.
                !browser_is_webkit &&
                event.type === 'keydown' &&
                is_modifier(which)
            ) ||
            (   // Keypress events on firefox for normal characters
                !browser_is_webkit &&
                event.type === 'keypress'
            ) ||
            (   // Keydown events on webkit browsers for all keys
                browser_is_webkit &&
                event.type === 'keydown'
            )
        ){
            return which;
        }

        return false;
    }


    // Listen for new shortcuts being set
    function get_shortcut(options, passed_doc) {
        var // Internal tracking of keys pressed
            keyarray  = [],
            // What to attach key events to
            doc = typeof passed_doc === 'undefined' ? window : passed_doc,
            // Options
            max_keys = typeof(options.max_keys) === 'undefined' ? 0 : options.max_keys;


        function keydown_listener(event){
            event.preventDefault();
            var which = validate_event(event);

            if(which){
                if(CANCEL_ON.indexOf(which) !== -1){
                    return cancel(event);
                }

                else if(
                    keyarray.indexOf(which) === -1 &&
                    // And we cant go over max keys
                    keyarray.length < max_keys
                ){
                    keyarray.push(which);
                    dispatch_update(options.on_update, keyarray);
                }
            }

        }


        function keyup_listener(event){
            event.preventDefault();
            return tear_down();
        }


        // Cancel everything
        function cancel(event){
            if(event){
                event.preventDefault();
                event.stopPropagation();
            }
            keyarray = [];
            return tear_down();
        }


        function tear_down(){
            if(!has_non_modifier(keyarray)){
                keyarray = [];
            }

            if(options.on_set){
                dispatch_update(options.on_set, keyarray);
            }

            keyarray = [];

            doc.removeEventListener('keypress', keydown_listener, true);
            doc.removeEventListener('keydown', keydown_listener, true);
            doc.removeEventListener('keyup', keyup_listener, true);

            doc.removeEventListener('mousedown', cancel, true);
            doc.removeEventListener('blur', cancel, true);
            doc.removeEventListener('focus', cancel, true);

            if(options.on_complete){
                options.on_complete();
            }
        }


        doc.addEventListener('keypress', keydown_listener, true);
        doc.addEventListener('keydown', keydown_listener, true);
        doc.addEventListener('keyup', keyup_listener, true);

        // Entering or leaving the doc should cancel anything going on
        doc.addEventListener('mousedown', cancel, true);
        doc.addEventListener('blur', cancel, true);
        doc.addEventListener('focus', cancel, true);
    }


    function listen(callback, passed_doc){
        var keyarray = [],
            doc = typeof passed_doc === 'undefined' ? window : passed_doc;


        function keydown_listener(event){
            var which = validate_event(event),
                whichNotInArr = keyarray.indexOf(which) === -1,
                eventIsValid = (
                    !event.target ||
                    event.target.tagName == 'BODY' ||
                    event.target.tagName == 'HTML' ||
                    event.target.tagName == 'html' ||
                    event.target.tagName == 'DIV' ||
                    event.target.tagName == 'ARTICLE' ||
                    event.target.tagName == 'div' ||
                    event.target == document.documentElement
                );

            //Sites like gmail and Twitter have text inputs that are just divs
            //with contenteditable set to true. Shortcuts should not fire for
            //them. This should only run once we know the event is otherwise
            //valid.
            if (eventIsValid) {
                if (event.target.getAttribute('contenteditable')) {
                    eventIsValid = false;
                }
            }

            if (which && whichNotInArr && eventIsValid) {
                if (CANCEL_ON.indexOf(which) !== -1){
                    return cancel();
                }

                keyarray.push(which);
                dispatch_update(callback, keyarray);
            }
        }


        function keyup_listener(event){
            if(keyarray.length){
                dispatch_update(callback, keyarray);
                keyarray = [];
            }
        }


        function cancel(){
            keyarray = [];
            return false;
        }


        function stop(){
            keyarray = [];

            doc.removeEventListener('keypress', keydown_listener, true);
            doc.removeEventListener('keydown', keydown_listener, true);
            doc.removeEventListener('keyup', keyup_listener, true);

            doc.removeEventListener('blur', cancel);
            doc.removeEventListener('focus', cancel);
        }

        doc.addEventListener('keypress', keydown_listener, true);
        doc.addEventListener('keydown', keydown_listener, true);
        doc.addEventListener('keyup', keyup_listener, true);

        // Entering and leaving the doc should cancel any active presses
        doc.addEventListener('blur', cancel, true);
        doc.addEventListener('focus', cancel, true);

        return {
            stop: stop
        };
    }

    // TODO: We might just want to declare each function as a member of exports
    // instead of doing it here.
    exports.listen = listen;
    exports.get_shortcut = get_shortcut;
    exports.keyarray_to_shortcut = keyarray_to_shortcut;
    exports.shortcut_to_keyarray = shortcut_to_keyarray;
    exports.transform_which = transform_which;
    exports.is_modifier = is_modifier;

    return exports;
}())));

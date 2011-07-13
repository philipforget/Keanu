(function(){

    function shortcut_mouseup_handler(event){
        event.preventDefault();
        var shortcut_bar = event.currentTarget;
        // For now, don't let me click on this again
        shortcut_bar.removeEventListener('mousedown', shortcut_mouseup_handler);

        Keanu.get_key_array({
            max_keys: 4,
            on_update: function(keychord){
                console.log("Updating: " + keychord);
            },
            on_set: function(keychord){
                console.log("Setting: " + keychord);
            },
            on_complete: function(){
                console.log("Shutting down");
                setTimeout(function(){
                    shortcut_bar.addEventListener('mousedown', shortcut_mouseup_handler);
                } , 200);
            }
        });
    }

    document.querySelector('ul.shortcut').addEventListener('mousedown', shortcut_mouseup_handler);
}());

(function(){
    // Simple example, just use the raw string
    function example1_handler(event){
        event.preventDefault();
        var shortcut_bar = event.currentTarget;
        // For now, don't let me click on this again
        shortcut_bar.removeEventListener('mouseup', example1_handler);
        shortcut_bar.className = 'active';

        Keanu.get_shortcut({
            max_keys: 4,
            on_update: function(shortcut){
                shortcut_bar.innerHTML = shortcut;
            },
            on_set: function(shortcut){
                shortcut_bar.innerHTML = shortcut;
            },
            on_complete: function(){
                setTimeout(function(){
                    shortcut_bar.addEventListener('mouseup', example1_handler);
                } , 200);
                shortcut_bar.className = '';
            }
        });
    }
    document.querySelector('#example1').addEventListener('mouseup', example1_handler);

    // A bit more complicated, render the shortcut as a ul
    function example2_handler(event){
        event.preventDefault();
        var shortcut_bar = event.currentTarget;
        // For now, don't let me click on this again
        shortcut_bar.removeEventListener('mouseup', example2_handler);
        shortcut_bar.className = 'active';

        function display_shortcut(key_array){
            var display_ul = document.createElement('ul'),
                key_index, key, display_li;

            shortcut_bar.innerHTML = "";

            for(key_index in key_array){
                if(key_array.hasOwnProperty(key_index)){
                    key = key_array[key_index];
                    display_li = document.createElement('li');
                    // Add a dash between keys
                    display_li.innerHTML = (key_index > 0 ? '- ' : '') + key.display;
                    // Add a class of modifier if the key is a modifier
                    if(key.is_modifier){
                        display_li.className = "modifier";
                    }
                    shortcut_bar.appendChild(display_li);
                }
            }
        }

        Keanu.get_shortcut({
            max_keys: 4,
            on_update: function(shortcut, key_array){
                display_shortcut(key_array);
            },
            on_set: function(shortcut, key_array){
                display_shortcut(key_array);
            },
            on_complete: function(){
                setTimeout(function(){
                    shortcut_bar.addEventListener('mouseup', example2_handler);
                } , 200);
                shortcut_bar.className = '';
            }
        });
    }
    document.querySelector('#example2').addEventListener('mouseup', example2_handler);
}());

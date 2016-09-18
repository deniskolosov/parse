$(document).ready(function() {
    var max_fields      = 5; //maximum input boxes allowed
    var wrapper         = $(".wrapper"); //Fields wrapper
    var add_button      = $(".addUrl"); //Add button ID

    var x = 1;
    $(add_button).click(function(e){ //on add input button click
        e.preventDefault();
        if(x < max_fields){ //max input box allowed
            x++; //text box increment
            $(wrapper).append('<div class="form-group"><input type="url" class="form-control" name="url'+ x + '"/><a href="#" class="remove_field">удалить</a></div>'); //add input box
        }
    });

    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = ws_scheme + '://' + window.location.host;
    console.log("Connecting to " + ws_path);
    var socket = new ReconnectingWebSocket(ws_path);

    socket.onmessage = function(message) {
        console.log("Got message: " + message.data);
        var data = JSON.parse(message.data);

        // if action is started, add new item to table
        if (data.action == "added") {
            var task_status = $("#taskStatus");
            var ele = $('<div class="col-md-6" style="margin-top:5px"></div>');
            ele.attr("id", data.page_id);
            var item_name = $("<span></span>").text(data.page_url);
            ele.append(item_name);
            var item_status = $("<div></div>");
            item_status.attr("id", "item-status-" + data.page_id);
            var span = $('<span class="label label-primary"></span>').text(data.page_status);
            item_status.append(span);
            ele.append(item_status);
            task_status.append(ele);
            message = {
                action: "is_processing",
                page_id: data.page_id
            };
            var timerId = setInterval(function() {
                message.timer_id = timerId;
                socket.send(JSON.stringify(message));
            }, 500);

        } else if (data.action == "processing"){
            $("#item-status-"+data.page_id).html("processing");
        }
        else if (data.action == "parsed") {
            clearInterval(data.timer_id);
            var label = $('#item-status-' + data.page_id + ' span');
            label.attr("class", "label label-success");
            label.text(data.page_status);
            var row = $('#' + data.page_id);
            row.append($('<div>Title: '+ data.title + ' </div>'));
            row.append($('<div>first h1: '+ data.first_h1 + '</div>'));
            row.css("background", "url(" + data.first_img + ") no-repeat");
            row.css("border", "solid 1px");
        }


        $(wrapper).on("click", ".remove_field", function(e) { //user click on remove text
            e.preventDefault();
            $(this).parent('div').remove();
            x--;
        });

        $("#urlsForm").submit(function(event) {
            event.preventDefault();
            data = $(this).serializeArray();
            var message = {
                action: "add_parsing_task",
                data: data
            };
            message = JSON.stringify(message);
            socket.send(message);
        });
    };
});

$(document).ready(function() {
    var max_fields      = 5;
    var wrapper         = $(".wrapper");
    var add_button      = $(".addUrl");

    var x = 1;
    $(add_button).click(function(e){
        e.preventDefault();
        if(x < max_fields){
            x++;
            $(wrapper).append('<div class="form-group"><input type="url" class="form-control" name="url'+ x + '"/><a href="#" class="remove_field">удалить</a></div>'); //add input box
        }
    });

    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = ws_scheme + '://' + window.location.host;
    console.log("Connecting to " + ws_path);
    var socket = new ReconnectingWebSocket(ws_path);

    $("#startButton").click(function(event) {
        event.preventDefault();
        data = $("#urlsForm").serializeArray();
        var message = {
            action: "add_parsing_task",
            data: data
        };
        message = JSON.stringify(message);
        socket.send(message);
    });

    socket.onmessage = function(message) {
        var data = JSON.parse(message.data);
        var startButton = $("#startButton");
        var stopButton = $("#stopButton");

        if (data.action == "added") {
            startButton.prop('disabled', true);
            stopButton.prop('disabled', false);
            stopButton.click(function(){
                message = {
                    action: "stop_task",
                    page_id: data.page_id
                };
                socket.send(JSON.stringify(message));
                startButton.prop('disabled', false);
                stopButton.prop('disabled', true);
            });
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
        } else if (data.action == "parsed") {
            clearInterval(data.timer_id);
            startButton.prop('disabled', false);
            stopButton.prop('disabled', true);

            var label = $('#item-status-' + data.page_id + ' span');
            label.attr("class", "label label-success");
            label.text(data.page_status);

            var row = $('#' + data.page_id);
            row.append($('<div>Title: '+ data.title + ' </div>'));
            row.append($('<div>first h1: '+ data.first_h1 + '</div>'));
            row.css("background", "url(" + data.first_img + ") no-repeat");
            row.css("border", "solid 1px");

        } else if (data.action == "cancelled") {
            clearInterval(data.timer_id);
            var cancelled = $('#item-status-' + data.page_id + ' span');
            cancelled.attr("class", "label label-warning");
            cancelled.text(data.page_status);
        }

        $(wrapper).on("click", ".remove_field", function(e) { //user click on remove text
            e.preventDefault();
            $(this).parent('div').remove();
            x--;
        });

    };
});

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

    $(wrapper).on("click", ".remove_field", function(e) { //user click on remove text
        e.preventDefault();
        $(this).parent('div').remove();
        x--;
    });

    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = ws_scheme + '://' + window.location.host;
    console.log("Connecting to " + ws_path);
    var socket = new ReconnectingWebSocket(ws_path);

    var currentPage = 1;

    var nextPageButton = $("#nextPage");
    var prevPageButton = $("#prevPage");
    var pagesDiv = $("#pagesDiv");
    var currentPageLabel = $("#currentPageLabel");

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

    nextPageButton.click(function() {
        if (totalPages == 1){ return }
        currentPage = currentPage + 1;
        currentPageLabel.text(currentPage);
        if (totalPages == currentPage) {
            nextPageButton.prop('disabled', true);
        }
        if (currentPage == 2) {
            prevPageButton.prop('disabled', false);
        }
        fillPages(currentPage);
    });

    prevPageButton.click(function() {
        if (totalPages == 1 || currentPage == 1) { return }
        if (totalPages == currentPage) {
            nextPageButton.prop('disabled', false);
        }
        currentPage = currentPage - 1;
        currentPageLabel.text(currentPage);
        if (currentPage == 1) {
            prevPageButton.prop('disabled', true);
        }
        fillPages(currentPage);
    });

    var fillPages = function(pageNumber){
        $.ajax({
            url: '/?page_number=' + pageNumber,
            success: function(data) {
                pagesDiv.empty();
                data = data['pages'];
                if (data.length > 0) {
                    for (var i = 0, total = data.length; i < total; i++) {
                        var pageUrl = data[i].url;
                        var title = data[i].title;
                        var status = data[i].status;
                        var imgUrl = data[i].img;
                        var id = data[i].page_id;
                        var ele = $('<div class="page col-md-6">' +
                            '<span>' + pageUrl + '</span><br>' +
                            '<span>' + title + '</span><br>' +
                            '<span class="label label-primary" id="item-status-'
                            + id +'">' + status + '</span>' +
                            '</div>');
                        ele.append($(' <a class="btn btn-xs btn-info" href="' + imgUrl + '" download="image.jpg">Скачать фон</a>'));
                        ele.css("background", "url(" + imgUrl + ") no-repeat");
                        pagesDiv.append(ele);
                    }
                } else {
                    pagesDiv.append('Нет спарсенных страниц');
                }
            }
        });
    };

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
            fillPages(currentPage);

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

            fillPages(currentPage);
            var label = $('#item-status-' + data.page_id);
            label.attr("class", "label label-success");

        } else if (data.action == "cancelled") {
            clearInterval(data.timer_id);
            var cancelled = $('#item-status-' + data.page_id);
            cancelled.attr("class", "label label-warning");
            fillPages(currentPage);
        }
    };
});

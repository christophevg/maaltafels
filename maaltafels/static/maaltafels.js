(function() {

  // track keydown events and dispatch them to the views that might require
  // keyboard input
  document.addEventListener("keydown", keyDownTextField, false);
  function keyDownTextField(e) {
    if( ! handle_dialog_keypress(e.keyCode) ) {
      handle_selection_keypress(e.keyCode);
      handle_test_keypress(e.keyCode);
      handle_feedback_keypress(e.keyCode);
    }
  }

  // View: selection, allows for selecting which multiplication tables to 
  //       include in the test

  function show_selection() {
    $("#duration").val(0);
    $("div#selection").show();
    check_version();
  }

  // check for updated version on sever
  function check_version() {
    $.getJSON( "/api/version", function(data) {
      if(__version__ != data) { report_update(); }
    });
  }

  // accept 0-9 and enter/return and trigger the corresponding buttons
  function handle_selection_keypress(keyCode) {
    if($("div#selection").is(":hidden")) { return; }
    if(keyCode >= "0".charCodeAt() && keyCode <= "9".charCodeAt()) {
      key = String.fromCharCode(keyCode);
      if(key == "0") { key = "10"; }
      button = $("button.choice." + key);
      toggle(button);
    } else if(keyCode == 13) { // enter / ok
      click( $("button.start") );
    }
  }

  // collect tables, run the countdown and start the test
  $("button.start").click(function(){
    var tables = $("button.choice.active").map(function() {
      return $(this).data("choice");
    }).get();
    if( tables.length < 1) {
      report_error("Kies eerst 1 of meer tafels om te oefenen...");
      return;
    }
    release($("button.choice")); // clean up
    $("div#selection").hide()
    start_session(tables);
  });

  // View: countdown, counts down from 3 and starts the next action afterwards

  function countdown(whenDone) {
    $("div.digit").hide();
    $("div#countdown").show();
    $("div.digit.3").fadeIn(1000, function(){
      $(this).hide();
      $("div.digit.2").fadeIn(1000, function() {
        $(this).hide();
        $("div.digit.1").fadeIn(1000, function() {
          $(this).hide();
          $("div#countdown").hide();
          whenDone();
        });
      });
    });
  }

  // View: test, generates exercise, accepts answer, gives feedback and reports

  var session = {
    "id"       : null, // unique reference for the current session
    "tables"   : [],   // tables to choose from
    "start"    : 0,    // started at
    "end"      : 0,    // ended at
    "asked"    : [],   // questions asked
    "correct"  : 0,    // correct questions
    "time"     : 0,    // total (active) time
    "duration" : 0     // expected duration of session
  };
  
  var current = null; // current question

  function start_session(tables) {
    session.tables   = tables;
    session.start    = new Date();
    session.end      = 0;
    session.asked    = [];
    session.correct  = 0;
    session.time     = 0;
    session.duration = $("#duration").val();
    post("sessions", {
      "start"    : session.start,
      "tables"   : session.tables,
      "duration" : session.duration
    }, function(response) { 
      session.id = response;
    });
    countdown(function() {
      if(session.duration > 0) { start_timer(session.duration * 60); }
      $("div.answer").html("&nbsp;");
      $("div#test").show();
      ask_question();
    });
  }

  function update_session() {
    put("sessions/"+session.id, {
      "correct": session.correct,
      "total": session.asked.length,
      "time": session.time,
      "end": new Date()
    });    
  }

  function end_session() {
    update_session();
    end_timer();
    $("div#test").hide();
    show_feedback();
  }
  
  // View: feedback
  
  function show_feedback() {
    $("#feedback .total").html(session.asked.length);
    $("#feedback .correct").html(session.correct);
    $("#feedback .average").html(
      Math.round(session.time / session.asked.length /100)/10
    );
    render_evolution();
    $("#feedback").show();
  }
  
  var chart = null;

  function render_evolution() {
    if(chart != null) {
      chart.destroy();
      chart = null;
    }
    $.getJSON( "/api/results", function(data) {
      data.reverse();
      var labels=[], wrong=[], correct=[], times=[];
      for(var i in data) {
        var d = new Date(data[i]._id);
        labels.push(d.getDate()+"/"+(d.getMonth()+1));
        wrong.push(data[i].questions-data[i].correct);
        correct.push(data[i].correct);
        times.push(Math.round(data[i].time/100)/10);
      }
      var ctx = document.getElementById("evolution").getContext('2d');
      chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "tijd",
              data: times,
              borderWidth: 3,
              yAxisID: "time",
              xAxisId: "time",
              type: "line",
              fill: false,
              borderColor: "#aaaaff",
              backgroundColor: "#aaaaff"
            },
            {
              label: "correct",
              data: correct,
              borderWidth: 1,
              backgroundColor: "#aaffaa"
            },
            {
              label: "fout",
              data: wrong,
              borderWidth: 1,
              backgroundColor: "#ffaaaa"
            }
          ]
        },
        options: {
          scales: {
            xAxes: [
              {
                stacked: true
              },
              {
                id: "time",
                stacked: false
              }
            ],
            yAxes: [
              {
                type: "linear",
                beginAtZero: true,
                stacked: true
              }, {
                id: "time",
                type: "linear",
                position: "right",
                beginAtZero: true,
                min: 0
              }
            ]
          }
        }
      });
    });
  }

  $("#feedback button.ok").click(function(){
    $("#feedback").hide();
    show_selection();
  });
  
  // enter/return and trigger the corresponding button
  function handle_feedback_keypress(keyCode) {
    if($("#feedback").is(":hidden")) { return; }
    if(keyCode == 13) { // enter / ok
      button = $("#feedback button.ok");
    } else {
      return;
    }
    click(button);
  }

  function ask_question() {
    current = new question();
    $("DIV.left.argument").html(current.left);
    $("DIV.operator").html(current.operator);
    $("DIV.right.argument").html(current.right);
    $("DIV.answer").html("&nbsp;");
    current.start();
  }

  // question prototype
  // given a random table (t) and random digit (d), valid questions are:
  // t * d = e
  // d * t = e (inverted)
  // e : t = d
  function question() {
    this.t = session.tables[Math.floor(Math.random()*session.tables.length)];
    this.d = Math.round(Math.random()*10);
    this.e = this.t * this.d;
    this.i = Math.random() >= 0.5;
    this.operator     = Math.random() >= 0.5 ? "x" : ":";
    this.left         = this.operator == ":" ? this.e : (this.i ? this.d : this.t);
    this.right        = this.operator == ":" ? this.t : (this.i ? this.t : this.d);
    this.expected     = this.operator == ":" ? this.d : this.e;
    this.answer_given = null;
    this.time         = 0;
    this.toString = function toString() {
      return this.left + " " + this.operator + " " + this.right;
    };
    this.start = function start() {
      this.started_at = new Date().getTime();
      return this;
    };
    this.answer = function answer(given) {
      this.answer_given = isNaN(given) ? null : parseInt(given);
      this.stopped_at = new Date().getTime();
      this.time = this.stopped_at - this.started_at;
      return this;
    };
    this.is_correct = function is_correct() {
      return this.answer_given === this.expected;
    };
  };

  // accept 0-9, escape, backspace and enter/return and trigger the 
  // corresponding buttons
  function handle_test_keypress(keyCode) {
    if($("div#test").is(":hidden")) { return; }
    if(keyCode >= "0".charCodeAt() && keyCode <= "9".charCodeAt()) {
      button = $("#test button.digit." + String.fromCharCode(keyCode));
    } else if(keyCode == 8) {  // backspace / undo
      button = $("#test button.undo");
    } else if(keyCode == 13) { // enter / ok
      button = $("#test button.ok");
    } else if(keyCode == 27) { // esc / stop
      button = $("#test button.stop");
    } else {
      return;
    }
    click(button);
  }

  // add the digit value of the button to the answer "field"
  $("#test button.digit").click(function(event){
    digit = $(event.target).data("digit");
    input = $("div.answer").html();
    if(input == "&nbsp;" || input == 0) { input = ""; } // avoid leading 0
    input += digit;
    $("div.answer").html(input);
  });

  // perform a backspace, undoing the last entered digit
  $("#test button.undo").click(function() {
    input = $("div.answer").html();
    if(input == "&nbsp;") { return; }
    input = input.substring(0, input.length-1);
    if(input == "") { input = "&nbsp;" } // set filler
    $("div.answer").html(input);
  });

  // submit the answer
  $("#test button.ok").click(function(){
    if(current.answer($("div.answer").html()).is_correct()) {
      session.correct++;
      report_success("Dat heb je prima gedaan.");
    } else {
      report_failure(current);
    }
    session.asked.push(current);
    session.time += current.time;
    post("results", {
      "config"   : [ current.t, current.d, current.operator, current.i ],
      "question" : current.left + current.operator + current.right,
      "expected" : current.expected,
      "answer"   : current.answer_given,
      "time"     : current.time,
      "session"  : session.id
    });
    update_session();
  });

  // stop the test and log session results
  $("button.stop").click(end_session);

  // AJAX helper function

  function put(resource, doc, callback) {
    ajax("put", resource, doc, callback);
  }
  
  function post(resource, doc, callback) {
    ajax("post", resource, doc, callback);
  }
  
  function ajax(type, resource, doc, callback) {
    $.ajax( {
      url: "/api/" + resource,
      type: type,
      data: JSON.stringify(doc),
      dataType: "json",
      contentType: "application/json",
      success: function(response) {
        if(callback) { callback(response); }
      },
      error: function(response) {
        console.log("failed to post", resource, doc, response);
      }
    });
  }

  // modal dialog helper functions

  function report_error(msg, title) {
    $("#dialog").addClass("error-dialog");
    $("#dialog .modal-title").html(title || "Ooops...");
    $("#dialog .modal-body").html(msg);
    $("#dialog .btn.ok").show();
    $("#dialog").modal({backdrop: "static", keyboard: false});
  }

  function report_update() {
    $("#dialog").addClass("update-dialog");
    $("#dialog .modal-title").html("Nieuw !!!");
    $("#dialog .modal-body").html("Je app is verbetered. Klaar voor wat nieuws?");
    $("#dialog .btn.ok").show().click( function() { window.location.reload(true); } );
    $("#dialog").modal({backdrop: "static", keyboard: false});
  }

  function report_success(msg, title) {
    $("#dialog").addClass("success-dialog");
    $("#dialog .modal-title").html(title || "Super...");
    $("#dialog .modal-body").html(msg + "<br>Doen we er nog een?");
    $("#dialog .btn.yes").show().click( ask_question );
    $("#dialog .btn.no").show().click( end_session );
    $("#dialog").modal({backdrop: "static", keyboard: false});
  }

  function report_failure(question, title) {
    $("#dialog").addClass("failure-dialog");
    $("#dialog .modal-title").html(title || "Ooops...");
    var answer = question.answer_given === null ? "niets" : question.answer_given,
        msg = "<b>" + question.toString() + "</b> is <b>" + question.expected +
              "</b>, niet <b>" + answer + "</b>!";
    $("#dialog .modal-body").html(msg + "<br>Doen we een andere?");
    $("#dialog .btn.yes").show().click( ask_question );
    $("#dialog .btn.no").show().click( end_session );
    $("#dialog").modal({backdrop: "static", keyboard: false});
  }

  $("#dialog").on("hidden.bs.modal", function (e) {
    $("#dialog").removeClass([
      "update-dialog",
      "success-dialog",
      "error-dialog",
      "failure-dialog"
    ]);
    $("#dialog .modal-title").html("");
    $("#dialog .modal-body").html("");
    $("#dialog .modal-footer button").hide().unbind("click");
  })

  // accept enter/return to handle default ok/yes button
  function handle_dialog_keypress(keyCode) {
    if($("#dialog").is(":hidden")) { return false; }
    if(keyCode == 13) { // enter
      if($("dialog .error-dialog").is(":visible")) {
        click( $("#dialog .btn.ok"));
      } else {
        click( $("#dialog .btn.yes"));
      }
    }
    return true;
  }

  // duration timer support

  function start_timer(duration) {
    $("#timer").show();
    update_timer(duration, duration);
  }

  var timer = null;

  function update_timer(remaining, total) {
    $("#timer .bar").width((remaining/total*100.0)+"%");
    if(remaining > 0) {
      timer = setTimeout(function(){ update_timer(remaining-0.1, total)}, 100);
    } else {
      end_timer();
    }
  }

  function end_timer() {
    if(timer) { clearTimeout(timer); }
    $("#timer").hide();
    $("#timer .bar").width("100%");
  }

  // button helper functions

  function release(button) {
    button.removeClass("active");
    button.attr("aria-pressed", "false");
  }

  function press(button) {
    button.addClass("active");
    button.attr("aria-pressed", "true");
  }
  
  function toggle(button) {
    if(button.hasClass("active")) {
      release(button);
    } else {
      press(button);
    }
  }

  function click(button) {
    press(button);
    button.trigger("click");
    setTimeout(function(){ release(button); }, 150);
  }
  
})();

(function() {

  // track keydown events and dispatch them to the views that might require
  // keyboard input
  document.addEventListener("keydown", keyDownTextField, false);
  function keyDownTextField(e) {
    handle_selection_keypress(e.keyCode);
    handle_test_keypress(e.keyCode);
  }

  // View: selection, allows for selecting which multiplication tables to 
  //       include in the test

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
    countdown(function() { test(tables); });
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
    "tables" : [],   // tables to choose from
    "start"  : 0,    // session start
    "asked"  : []    // questions asked
  };
  
  var current = null; // current question

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
    this.toString = function toString() {
      return this.left + " " + this.operator + " " + this.right;
    };
    this.start = function start() {
      this.started_at = new Date().getTime();
      return this;
    };
    this.answer = function answer(given) {
      this.answer_given = parseInt(given);
      this.stopped_at = new Date().getTime();
      return this;
    };
    this.is_correct = function is_correct() {
      return this.answer_given === this.expected;
    };
  };

  function test(tables) {
    $("div.answer").html("&nbsp;");
    $("div#test").show();
    session.tables = tables;
    ask_question();
  }

  // given a random table (t) and random digit (d), valid questions are:
  // t * d = e
  // d * t = e (inverted)
  // e : t = d
  function ask_question() {
    current = new question();
    $("DIV.left.argument").html(current.left);
    $("DIV.operator").html(current.operator);
    $("DIV.right.argument").html(current.right);
    $("DIV.answer").html("&nbsp;");
    current.start();
  }

  // accept 0-9, escape, backspace and enter/return and trigger the 
  // corresponding buttons
  function handle_test_keypress(keyCode) {
    if($("div#test").is(":hidden")) { return; }
    if(keyCode >= "0".charCodeAt() && keyCode <= "9".charCodeAt()) {
      button = $("button.digit." + String.fromCharCode(keyCode));
    } else if(keyCode == 8) {  // backspace / undo
      button = $("button.undo");
    } else if(keyCode == 13) { // enter / ok
      button = $("button.ok");
    } else if(keyCode == 27) { // esc / stop
      button = $("button.stop");
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
      report_success("Dat heb je prima gedaan.")
    } else {
      report_failure(current);
    }
    session.asked.push(current);
    ask_question();
  });

  // stop the test and show session results
  $("button.stop").click(function(){
    console.log(session);
    $("div#test").hide();
    $("div#selection").show()  
  });

  // modal dialog helper functions

  function report_error(msg, title) {
    $("#dialog").addClass("error-dialog");
    $("#dialog .modal-title").html(title || "Ooops...");
    $("#dialog .modal-body").html(msg);
    $("#dialog .btn.ok").show();
    $("#dialog").modal({backdrop: "static"});
  }

  function report_success(msg, title) {
    $("#dialog").addClass("success-dialog");
    $("#dialog .modal-title").html(title || "Super...");
    $("#dialog .modal-body").html(msg + "<br>Doen we er nog een?");
    $("#dialog .btn.yes").show();
    $("#dialog .btn.no").show().click(function() { click($("button.stop")); });
    $("#dialog").modal({backdrop: "static"});
  }

  function report_failure(question, title) {
    $("#dialog").addClass("failure-dialog");
    $("#dialog .modal-title").html(title || "Ooops...");
    var msg = "<b>" + question.toString() + "</b> is <b>" + question.expected +
              "</b>, niet <b>" + question.answer_given + "</b>!";
    $("#dialog .modal-body").html(msg + "<br>Doen we een andere?");
    $("#dialog .btn.yes").show()
    $("#dialog .btn.no").show().click(function() { click($("button.stop")); });
    $("#dialog").modal({backdrop: "static"});
  }

  $("#dialog").on("hidden.bs.modal", function (e) {
    $("#dialog").removeClass([
      "success-dialog",
      "error-dialog",
      "failure-dialog"
    ]);
    $("#dialog .modal-footer button").hide();
  })

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

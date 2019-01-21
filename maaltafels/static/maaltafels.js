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

  // collect choices, run the countdown and start the test
  $("button.start").click(function(){
    var choices = $("button.choice .active").map(function(){
      return $(this).data("choice");
    }).get();
    release($("button.choice")); // clean up
    $("div#selection").hide()
    countdown(function() { test(choices); });
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

  function test(choices) {
    $("div.answer").html("&nbsp;");
    $("div#test").show();
    console.log("testing", choices);
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
  $("button.digit").click(function(event){
    digit = $(event.target).data("digit");
    current = $("div.answer").html();
    if(current == "&nbsp;") {
      if(digit == 0 ) { return; } // skip leading zeroes
      current = "";
    }
    current += digit;
    $("div.answer").html(current);
  });

  // perform a backspace, undoing the last entered digit
  $("button.undo").click(function() {
    current = $("div.answer").html();
    if(current == "&nbsp;") { return; }
    current = current.substring(0, current.length-1);
    if(current == "") { current = "&nbsp;" }
    $("div.answer").html(current);
  });

  // submit the answer
  $("button.ok").click(function(){
    // TODO: check answer, show result
  });

  // stop the test and show session results
  $("button.stop").click(function(){
    $("div#test").hide();
    $("div#selection").show()  
  });

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

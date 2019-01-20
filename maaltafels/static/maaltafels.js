document.addEventListener("keydown", keyDownTextField, false);
function keyDownTextField(e) {
	handle_selection_keypress(e.keyCode);
	handle_test_keypress(e.keyCode);
}

function handle_selection_keypress(keyCode) {
	if($("div#selection").is(":hidden")) { return; }
	if(keyCode >= "0".charCodeAt() && keyCode <= "9".charCodeAt()) {
		key = String.fromCharCode(keyCode);
		if(key == "0") { key = "10"; }
		button = $("button.choice." + key);
		if(button.hasClass("active")) {
			button.removeClass("active");
			$("button.choice").attr("aria-pressed", "false");
		} else {
			button.addClass("active");
			$("button.choice").attr("aria-pressed", "true");
		}
	} else if(keyCode == 13) { // enter / ok
		click( $("button.start") );
	}
}

$("button.start").click(function(){
	// collect choices
	var choices = [];
	$("button.choice").each(function(button){
		if($(this).hasClass("active")) {
			choices.push($(this).data("choice"));
		}
	});
	$("button.choice").removeClass("active");
	$("button.choice").attr("aria-pressed", "false");
	$("div#selection").hide()
	countdown(function() { test(choices); });
});

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

function test(choices) {
	$("div.result").html("&nbsp;");
	$("div#test").show();
	console.log("testing", choices);
}

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

function click(button) {
	button.addClass("active").trigger('click');
	setTimeout(function(){ button.removeClass("active"); }, 150);
}

$("button.digit").click(function(event){
	digit = $(event.target).data("digit");
	current = $("div.result").html();
	if(current == "&nbsp;") {
		if(digit == 0 ) { return; } // skip leading zeroes
		current = "";
	}
	current += digit;
	$("div.result").html(current);
});

$("button.undo").click(function() {
	current = $("div.result").html();
	if(current == "&nbsp;") { return; }
	current = current.substring(0, current.length-1);
	if(current == "") { current = "&nbsp;" }
	$("div.result").html(current);
});

$("button.ok").click(function(){
	$("div#test").hide();
	$("div#selection").show()	
});

$("button.stop").click(function(){
	$("div#test").hide();
	$("div#selection").show()	
});

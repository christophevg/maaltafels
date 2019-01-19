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
	$("div#test").show();

	console.log("testing", choices);

	$("div#test").hide();
	$("div#selection").show()	
}

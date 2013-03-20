

var GREEN = '#0CCC53';
var RED = '#BF0A0A';
var NUM_SUBREDDITS = 8;
var queue = $.Deferred();
queue.resolve();

var addToQueue = function(included) {

	$('.loading').text('loading...');

	queue = queue.then(function() {  // Using jQuery deferred object.
		
		// Returns jqXHR to `then`:
		return $.post('/reddit', { subs: included }, function(html) {
			
			if (!html) return;

			var new_comments = $(html)[4];  // #comments is the fifth item in the array. Find a way to do it generically -- inspect each array member?
			$('#comments').replaceWith(new_comments);  // Use infinite scrolling?
			decodeEntities();

		});
	});

	queue.done(function() {
		if (queue.state() === 'resolved') $('.loading').text('');
	});

};

// Update the server with new set of included categories.
var updateIncluded = function() {

	var included = [];

	$('.included').each(function() {  // Put each included category into an array.

		if (!$(this).hasClass('excluded')) {
			included.push( $(this).children('.name').text() );
		}

	});

	addToQueue(included);  // Add to queue so requests process in order.
};

// Html strings coming from Reddit need to be decoded.
var decodeEntities = function() {

	$('.text').each(function() {
		$(this).html( $(this).text() );
	});

};

// Add category to list of included categories.
var include = function($obj) {

	$obj.removeClass('excluded');
	$obj.children('.plus').text('+ ');  // Plus sign shows category is included.

};

// Remove category from list of included categories.
var exclude = function($obj) {

	if ($('.excluded').length === NUM_SUBREDDITS - 1) return;  // Don't permit excluding all categories.
	$obj.addClass('excluded');
	$obj.children('.plus').text('- ');  // Minus sign shows category is excluded.

};

$(function() {

	decodeEntities();

	$('blockquote').each(function() {  // Style block quotes.
		$(this).css('font-style', 'italic');
	});

	$('.included').click(function() { // Toggle inclusion when category is clicked.

		$(this).hasClass('excluded') ? include($(this)) : exclude($(this));
		updateIncluded();

	});

	$('.only').hover(function() {  // `Only` is a special button used to exclude all
				       // categories but the one being clicked.

		$('.included').addClass('red');   // Show that other categories will be excluded
						  // if user clicks by coloring them red.

		$(this).parent().addClass('green'); // Show that category being hovered over
						    // will be included by coloring it green.

	}, function() {  // On stop-hovering...

		$('.included').removeClass('red');
		$(this).parent().removeClass('green');

	});

	$('.only').click(function(e) {

		e.stopPropagation();

		var clicked = $(this).parent();
		
		include(clicked);
		
		$('.included').each(function() {  // Exclude all besides `clicked`.
			if ( !$(this).is(clicked) ) exclude($(this));
		});

		updateIncluded();
	});

});




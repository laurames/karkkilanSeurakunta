$( document ).ready(function() {
  //calling the first function for fetching event data:
  weeksEvents();

	var clock = $('.clock').FlipClock({
		clockFace: 'TwentyFourHourClock'
	});

  $('.moreText').truncate({
    width: 'auto',
    token: '&hellip;',
    side: 'center',
    addclass: 'highlight',
    addtitle: false,
  });

});

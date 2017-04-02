/*
Author: Laura Meskanen-Kundu
Project: To parse event data from www.karkkilanseurakunta.fi site
Technologies used: YQL + javascript + html

YQL query is:
select * from html where url="www.karkkilanseurakunta.fi/tapahtumat/-/haku/0/11/7/2016/_/17/7/2016/week/1#events" and xpath='//div[@class="event-list-wrapper"]/div[contains(@class, "event-item-list")]'

example URL format for events is: "www.karkkilanseurakunta.fi/tapahtumat/-/haku/0/11/7/2016/_/17/7/2016/week/1#events"

example Query URL format: www.karkkilanseurakunta.fi%2Ftapahtumat%2F-%2Fhaku%2F0%2F11%2F7%2F2016%2F_%2F17%2F7%2F2016 %2Fweek%2F1%23events
*/
var activeAjaxConnections = 0; //checks if we have all data

function weeksEvents(){
  todaysDates();
  var resultData = []; //all event data in array with objects
  var pages; //number of pages

  //The current dates for today:
  function todaysDates(){
    var today = new Date();
    var dayOfTheWeek = today.getDay();
    var day = today.getDate();
    var month = today.getMonth()+1;
    var year = today.getFullYear();
    $(".year").append(year);
    weekForQuery(today, dayOfTheWeek, day, month, year);
  }

  //function for getting the monday and sunday in query format:
  function weekForQuery(today, dayOfTheWeek, day, month, year){
    var dayOffset;
    var daysToOffsetBy = function(offsetBy){
      var newToday = new Date();
      var offset = newToday.setDate(newToday.getDate() + offsetBy);
      return newToday;
    }
    if(dayOfTheWeek === 1){
      dayOffset = daysToOffsetBy(7);
      startOfWeek = '3%2F4%2F2017';
      endOfWeek = '9%2F4%2F2017';
      //startOfWeek = day + '%2F' + month + '%2F' + year;
      //endOfWeek = dayOffset.getDate() + '%2F' + (dayOffset.getMonth()+1) + '%2F' + dayOffset.getFullYear();
    }else if(dayOfTheWeek === 0){
      dayOffset = daysToOffsetBy(-7);
      startOfWeek = '3%2F4%2F2017';
      endOfWeek = '9%2F4%2F2017';
      //startOfWeek = dayOffset.getDate() + '%2F' + (dayOffset.getMonth()+1) + '%2F' + dayOffset.getFullYear();
      //endOfWeek = day + '%2F' + month + '%2F' + year;
    }else{
      var fromMonday = 1-dayOfTheWeek; //negative number
      var fromSunday = 7-dayOfTheWeek; //positive number
      dayOffset = daysToOffsetBy(fromMonday);
      var dayOffsetSunday = daysToOffsetBy(fromSunday);
      startOfWeek = '3%2F4%2F2017';
      endOfWeek = '9%2F4%2F2017';
      //startOfWeek = dayOffset.getDate() + '%2F' + (dayOffset.getMonth()+1) + '%2F' + dayOffset.getFullYear();
      //endOfWeek = dayOffsetSunday.getDate() + '%2F' + (dayOffsetSunday.getMonth()+1) + '%2F' + dayOffsetSunday.getFullYear();
    }
    findPages();
  }

  function findPages(){
    //check how many pages:
    //select * from html where url="www.karkkilanseurakunta.fi/tapahtumat/-/haku/0/29/1/2017/_/5/2/2017/week/2#events" and xpath='//ul[@class="pagination"]/li'
    var queryPages = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22www.karkkilanseurakunta.fi%2Ftapahtumat%2F-%2Fhaku%2F0%2F" + startOfWeek + "%2F_%2F" + endOfWeek + "%2Fweek%2F2%23events%22%20and%20xpath%3D'%2F%2Ful%5B%40class%3D%22pagination%22%5D%2Fli'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"

    if(queryPages.match('^http')){
      $.ajax({
        async: false,
        url: queryPages,
        success: function(data) {
          resultData = data;
          var numberOfPages = resultData.query.count;
          if(numberOfPages > 0){
            pages = numberOfPages-2;
            return pages;
          }else{
            pages= 1;
            return pages;
          }
        }
      });
      buildQueryString(startOfWeek, endOfWeek, pages);
    }else {
      console.log("check the query request");
    }
  };

  function buildQueryString(startOfWeek, endOfWeek, pages){
    //the query:
    for(i=1; i<=pages; i++){
      var requestQuery = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22www.karkkilanseurakunta.fi%2Ftapahtumat%2F-%2Fhaku%2F0%2F" + startOfWeek + "%2F_%2F" + endOfWeek + "%2Fweek%2F" + i + "%23events%22%20and%20xpath%3D'%2F%2Fdiv%5B%40class%3D%22event-list-wrapper%22%5D%2Fdiv%5Bcontains(%40class%2C%20%22event-item-list%22)%5D'&format=xml&callback=?"

      doAjax(requestQuery, i);
    }
  }

  function doAjax(requestQuery, i){
    if(requestQuery.match('^http')){
      $.ajax({
        async: false,
        dataType: 'json',
        beforeSend: function(xhr) {
          activeAjaxConnections++;
        },
        url: requestQuery,
        success: function(data){
          activeAjaxConnections--;
          console.log("i is: "+i);
          var pageNum = i;
          resultData[i-1] = data;
          console.log(resultData);
          if (0 == activeAjaxConnections) {
            console.log("i am here and activeAjaxConnections = " + activeAjaxConnections);
            for(i=0; i<resultData.length; i++){
              var dataLenght = resultData[i].results.length;
              if(dataLenght != 0){
                for(y=0; y<dataLenght; y++){
                  var eventData = filterData(resultData[i].results[y]);
                  $('#eventsHidden').append(eventData);
                  cleanHTML();
                }
              }else{
                var errormsg = '<p class="error">Error: could not load the page.</p>';
                $('#eventTiles').append(errormsg);
              }
            }
          }
        }
      });
    }else{
      console.log("check the query request");
    }
  };

  function filterData(data){
    //filter away the sharing links
    data = data.replace(/<div class="share"[^>]*>[\S\s]*?<\/div>/,'');
    data = data.replace(/<img[^>]+src="([^">]+)/g,'')
    return data;
  }

  function cleanHTML(){
    $('.event-item-list a:first-child').remove();

    $('.event-item-list').each(function(){
      //var contentsH4 = $('#eventsHidden .event-item-list').find('h4').detach().html();
      var eventDate = $('.event-date').detach().html();
      var eventTime = $('.event-time').detach().html();
      var eventName = $('[itemprop="name"]').detach().html();
      var eventDescription = $('.description').detach().html();
      var eventLocation = $('.event-location').detach().html();

      //createEventsInSlideShow(eventDate, eventTime, eventName, eventDescription, eventLocation);
      createEventsInTiles(eventDate, eventTime, eventName, eventDescription, eventLocation);
    });
    displayScreenLoop();
  }

  function image(eventName){
    if(eventName.indexOf('Sähly') != -1){
      eventName = 'Sahly';
    }
    switch(eventName){
      case 'Perhemessu': return 'kirkko';
      case 'Naistenpiiri': return 'naisten';
      case 'Raamattupiiri': return 'raamattupiiri';
      case 'Perhekerho': return 'perhekerho';
      case 'Puuhakerho': return 'puuhakerho';
      case 'Juttutupa': return 'juttutupa'
      case 'KEKE- Keskiviikkokerho': return 'keke';
      case 'Kokkikerho': return 'kokkikerho';
      case 'Avoin Ikkuna': return 'ikkuna';
      case 'Perjantaikahvila': return 'kahvi';
      case 'Jobbis': return 'jobbis';
      case 'Iltamessu': return 'iltamessu';
      case 'Sahly': return 'sahly';
      case 'Messu': return 'messu';
      default: return 'logo';
    }
  }

  function createEventsInTiles(eventDate, eventTime, eventName, eventDescription, eventLocation){
    if(eventName != undefined){
      $('#eventTiles').append('<div class="singleEvent media col-md-3 col-centered">'+ '<div class="media-left media-middle"><img class="media-object img-circle" src="img/' + image(eventName) + '.png" alt=""></div><div class="media-body"><h1 class="media-heading"><span class="eventName">' + eventName + '</span></h1><p class="timeDate"><span class="eventDate">' + eventDate + '</span><span class="eventTime"> Kello: ' + eventTime + '</span></p><p class="eventDescription">Kuvaus: <span>' + eventDescription + '</span></p><p class="eventLocation">Paikka: ' + eventLocation + '</div></div>');
    }
  }

  function displayScreenLoop(){
    $( document ).ready(function() {
    //$('#button').click(function() {}
      $('#eventTiles .singleEvent').each(function(i) {
        var $div = $(this);
        setTimeout(function() {
          $div.addClass('grow').delay(10000).queue(function(next){
              $(this).removeClass('grow'); //.addClass('shrink')
              next();
          });
        }, 11000 * i);
      });
    });
  }

/*
  function createEventsInSlideShow(eventDate, eventTime, eventName, eventDescription, eventLocation){
    if(eventName != undefined){
      $('#slideshow').append('<div class="slide media col-md-3 col-centered">'+ '<div class="media-left media-middle"><img class="media-object img-circle" src="img/' + image(eventName) + '.png" alt=""></div><div class="media-body"><h1 class="media-heading"><span class="eventName">' + eventName + '</span></h1><p class="timeDate"><span class="eventDate">' + eventDate + '</span><span class="eventTime"> Kello: ' + eventTime + '</span></p><p class="eventDescription">Kuvaus: <span>' + eventDescription + '</span></p><p class="eventLocation">Paikka: ' + eventLocation + '</div></div>');
    }
  }

  function showSlides() {
      var i;
      var slides = document.getElementsByClassName("mySlides");
      var dots = document.getElementsByClassName("dot");
      for (i = 0; i < slides.length; i++) {
         slides[i].style.display = "none";
      }
      slideIndex++;
      if (slideIndex> slides.length) {slideIndex = 1}
      for (i = 0; i < dots.length; i++) {
          dots[i].className = dots[i].className.replace(" active", "");
      }
      slides[slideIndex-1].style.display = "block";
      dots[slideIndex-1].className += " active";
      setTimeout(showSlides, 2000); // Change image every 2 seconds
  }*/
}

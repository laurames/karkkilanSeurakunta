/*
Author: Laura Meskanen-Kundu
Project: To parse event data from www.karkkilanseurakunta.fi site
Technologies used: YQL + javascript + html

YQL query is:
select * from html where url="www.karkkilanseurakunta.fi/tapahtumat/-/haku/0/11/7/2016/_/17/7/2016/week/1#events" and xpath='//div[@class="event-list-wrapper"]/div[contains(@class, "event-item-list")]'

example URL format for events is: "www.karkkilanseurakunta.fi/tapahtumat/-/haku/0/11/7/2016/_/17/7/2016/week/1#events"

example Query URL format: www.karkkilanseurakunta.fi%2Ftapahtumat%2F-%2Fhaku%2F0%2F11%2F7%2F2016%2F_%2F17%2F7%2F2016 %2Fweek%2F1%23events
*/
function weeksEvents(){
  todaysDates();
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
      startOfWeek = day + '%2F' + month + '%2F' + year;
      endOfWeek = dayOffset.getDate() + '%2F' + (dayOffset.getMonth()+1) + '%2F' + dayOffset.getFullYear();
    }else if(dayOfTheWeek === 0){
      dayOffset = daysToOffsetBy(-7);
      startOfWeek = dayOffset.getDate() + '%2F' + (dayOffset.getMonth()+1) + '%2F' + dayOffset.getFullYear();
      endOfWeek = day + '%2F' + month + '%2F' + year;
    }else{
      var fromMonday = 1-dayOfTheWeek; //negative number
      var fromSunday = 7-dayOfTheWeek; //positive number
      dayOffset = daysToOffsetBy(fromMonday);
      var dayOffsetSunday = daysToOffsetBy(fromSunday);
      startOfWeek = dayOffset.getDate() + '%2F' + (dayOffset.getMonth()+1) + '%2F' + dayOffset.getFullYear();
      endOfWeek = dayOffsetSunday.getDate() + '%2F' + (dayOffsetSunday.getMonth()+1) + '%2F' + dayOffsetSunday.getFullYear();
    }
    console.log('startOfWeek: '+startOfWeek+' endOfWeek: ' + endOfWeek);
    buildQueryString(startOfWeek, endOfWeek);
  }

  function buildQueryString(startOfWeek, endOfWeek){
    //the query:
    var requestQuery = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22www.karkkilanseurakunta.fi%2Ftapahtumat%2F-%2Fhaku%2F0%2F" + startOfWeek + "%2F_%2F" + endOfWeek + "%2Fweek%2F1%23events%22%20and%20xpath%3D'%2F%2Fdiv%5B%40class%3D%22event-list-wrapper%22%5D%2Fdiv%5Bcontains(%40class%2C%20%22event-item-list%22)%5D'&format=xml&callback=?"
    console.log(requestQuery);
    doAjax(requestQuery);
  }

  function doAjax(requestQuery){
    var resultData;
    var dataLenght;

    if(requestQuery.match('^http')){
      $.getJSON(requestQuery, function(data){
        resultData = data;
        dataLenght = resultData.results.length;
        if(dataLenght != 0){
          for(i=0; i<dataLenght; i++){
            var eventData = filterData(resultData.results[i]);
            $('#events').append(eventData);
            cleanHTML();
          }
        }else {
          var errormsg = '<p class="error">Error: could not load the page.</p>';
          $('#events').append(errormsg);
        }
      });
    }else {
      console.log("check the query request");
    }
  }

  function filterData(data){
    //filter away the sharing links and images
    data = data.replace(/<div class="share"[^>]*>[\S\s]*?<\/div>/,'');
    //get the index of the images that don't have their root path
    var indexOfImage = data.indexOf('/seurakunta-theme');
    var rootUrl = "http://www.karkkilanseurakunta.fi";
    //place the root path into the string so that we have the images to display
    var output = [data.slice(0, indexOfImage), rootUrl, data.slice(indexOfImage)].join('');
    return output;
  }

  function cleanHTML(){
    $(".event-item-list a:first-child").remove();
  }
}
/*
function dayOfTheWeek(){
  var weekday = new Array(7);
  weekday[0]=  "Sunnuntai";
  weekday[1] = "Maanantai";
  weekday[2] = "Tiistai";
  weekday[3] = "Keskiviikko";
  weekday[4] = "Torstai";
  weekday[5] = "Perjantai";
  weekday[6] = "Lauantai";
  var n = weekday[today.getDay()];
  return n;
}
*/
var tmsData;


/* Request a specific page from the server to be rendered */
function sendPOSTRender(page){
  $.ajax({
    type: "POST",
    url : "render",
    data: {page : page},
    success:(res)=>{
      $("#content").html(res);
    },
    error:(res)=>{
      $("#content").html(res);
    }
  })
}



$(document).ready(() => {

  /* When user types a term and clicks enter, function is automatically called */
  $("#term-name").keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      selectTerm();
    }
  });

  /* When user types a subject and clicks enter, function is automatically called */
  $("#subjects-name").keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      runAPI();
    }
  });

  /* When user types a course and clicks enter, function is automatically called */
  $("#courses-name").keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      runAPI();
    }
  });

  /* When user types a method and clicks enter, function is automatically called */
  $("#methods-name").keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      runAPI();
    }
  });

  /* When user types an instructor and clicks enter, function is automatically called */
  $("#instructors-name").keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      runAPI();
    }
  });





  /* Populates dropdown with list of possible terms */
  $.ajax({
    url: '/allTerms',
    type: 'GET',
    success: (rows) => {
      $("#termsList").html("");
      for(term of rows){
        $("#termsList").append("<option value='"+term["term"]+"'>");
      }
    }
  })
  defaultContent = $("#content").html();
});


/* After selecting a term, the course select dropdown is displayed */
function showCourseSelect(){
  if(term != ""){
    $("#content").html(defaultContent);
    $('#term-input-group').hide();
    $('#course-input-group').show();
  }
}



/* Checks if class user type is a valid class from the database */
function validClass(course) {
  course = course.replace(/ /g,'');
  var datalist = $("#courseList");
  var children = datalist[0].children;
  for (var i=0; i<children.length; i++) {
    if (course == children[i].value.replace(/ /g,'')) {
      return children[i].value;
    }
  }
  return false;
}


/* Converts string to title case (ex: the boy went to the market -> The Boy Went To The Market) */
function titleCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
}



/* Allows the user to select a term and get a list of available classes */
function selectTerm(){
  var termAttr = $('#term-name');
  if (termAttr.val() != "--Select a Term--") {
    termString = titleCase(termAttr.val());
    term = termString
    termAttr.val('');
    $.ajax({
      url: '/allClasses',
      type: 'GET',
      data: {
        term: termString
      },
      success: (rows) => {
        $("#subjectsList").html("");
        $("#courseNamesList").html("");
        for (course of rows) {

          // Add subjects to data list
          if ( $("#subjectsList option[value='"+ course["ID"].split(" ")[0] +"']").length == 0 ){
            $("#subjectsList").append("<option value='"+course["ID"].split(" ")[0]+"'>");
          }

          // Add course names to data list
          if ( $("#courseNamesList option[value='"+ course["ID"] +"']").length == 0 ){
            $("#courseNamesList").append("<option value='"+course["ID"]+"'>");
          }
        }
        $('#term-input-group').hide();
        $('#course-input-group').show();
        // defaultContent = $("#content").html();
      }
    })
    $.ajax({
      url: '/allInstructors',
      type: 'GET',
      data: {
        term: termString
      },
      success: (rows) => {
        $("#instructorsList").html("");
        for (instructor of rows) {
          // Add instructor names to data list
          $("#instructorsList").append("<option value='"+instructor["ID"]+"'>");
        }
      }
    })

  }
}



function runAPI(){

  var jsonData = {};

  if ($('#subjects-name').val() && $('#courses-name').val()) {
    alert("Choose either a subject OR a course") 
    return;
  }


  if (!(!$('#subjects-name').val())) jsonData.subject = $('#subjects-name').val().toLowerCase();
  if (!(!$('#courses-name').val())) {
    jsonData.subject = $('#courses-name').val().toLowerCase().split(" ")[0];
    jsonData.number = $('#courses-name').val().toLowerCase().split(" ")[1];
  }
  if (!(!$('#methods-name').val())) jsonData.method = $('#methods-name').val();
  if (!(!$('#instructors-name').val())) jsonData.instructor = $('#instructors-name').val();

  console.log(JSON.stringify(jsonData));

  if (Object.keys(jsonData).length == 0) {
    alert("Please select a valid option");
    return;
  }

  $.ajax({
    url: '/tms',
    type: 'GET',
    data: jsonData,
    success: (rows) => {
      console.log(rows);

      // Stringify JSON to format
      var data = JSON.stringify(rows);
    
      data = JSON.parse(data);


      Loop1:
      for (let elem of data) {
        let res = "";
        elem.Times = JSON.stringify(elem.Times).replace(/\\/g, "");
        let temp = elem.Times;
        elem.Times = temp.substring(1, temp.length-1);
        if (elem.Times.includes(',')) {
          for (let time of elem.Times.split(',')) {
            let finalTime = parseTimeOut(time);
            if (finalTime == "TBD") {
              elem.Times = finalTime;
              continue Loop1;
            }
            res += finalTime + "\n";
          }
        } else {
          let time = elem.Times;
          let finalTime = parseTimeOut(time);
          if (finalTime == "TBD") {
            elem.Times = finalTime;
            continue Loop1;
          }
          res += finalTime + "\n";
        }
        elem.Times = res.substring(0, res.length-1);
      }

      $('#content').html("");
      $('#tmsTable').show();
      var $table = $('#tmsdata');


      //Initialize Bootstrap Table
      $(function() {
        $table.bootstrapTable({
          data: data
        });
      });
    }
  })
}


function parseTimeOut(time) {
  let arr = time.split(":");
  let day = arr[0];
  day = removeOuter(day);


  let actTime = arr.splice(1).join(`:`);
  actTime = removeOuter(actTime);
  if (actTime == "TBD") {
    return "TBD";
  }

  return getDay(day) + " " + actTime;
}

function removeOuter(str) {
  return str.substring(str.indexOf(`"`)+1, str.lastIndexOf(`"`));
}

function getDay(day) {
  switch(day) {
    case "M":
      return "Monday";
    case "T":
      return "Tuesday";
    case "W":
      return "Wednesday";
    case "R":
      return "Thursday";
    case "F":
      return "Friday";
    case "S":
      return "Saturday";
  }
}
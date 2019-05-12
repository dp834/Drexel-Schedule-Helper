/* Checks if the two time objects overlap */
function overlap(times1, times2) {
  // times1 = JSON.parse(times1.replace(/\\/g, ''));
  // times2 = JSON.parse(times2.replace(/\\/g, ''));
  // console.log(JSON.stringify(times1).substring(1,-2));
  // console.log(JSON.stringify(times2).substring(1,-2));
  // console.log(times1);
  // console.log(times2);
  if(times1["T"] == "TBD" || times2["T"] == "TBD"){
    return false;
  }
  for (var day1 in times1) {
    for (var day2 in times2) {
      if(overlapTimes(convert(day1, times1[day1]), convert(day2, times2[day2]))){
        // console.log(true);
        // console.log(times1[day1]);
        // console.log(times2[day2]);
        return true;
      }
    }
  }
  // console.log(false);
  return false;
}


/* Converts the day and time to start and end times object */
function convert(day, time) {
  // console.log(time);
  var timeList = time.split("-");
  var boundaries = {
    "startTime" : dayConvert(day, timeList[0]),
    "endTime" : dayConvert(day, timeList[1])
  };
  return boundaries;
}


/* Checks if two start and end time objects overlap */
function overlapTimes(time1, time2) {
  return (Math.max(time1.startTime, time2.startTime) <= Math.min(time1.endTime, time2.endTime));
}



/* Converts day and time object to a numerical value */
function dayConvert(day, time) {
  if (day == "M") return parseInt(convertTime(time)) + 0 * 24 * 60;
  if (day == "T") return parseInt(convertTime(time)) + 1 * 24 * 60;
  if (day == "W") return parseInt(convertTime(time)) + 2 * 24 * 60
  if (day == "R") return parseInt(convertTime(time)) + 3 * 24 * 60
  if (day == "F") return parseInt(convertTime(time)) + 4 * 24 * 60
  if (day == "S") return parseInt(convertTime(time)) + 5 * 24 * 60
}


/* Converts time to # from HH:MM AM/PM */
function convertTime(time) {
  // console.log("-------------------");
  // console.log(time);
  // console.log("-------------------");
  // console.log(time);
    var hours = Number(time.match(/^(\d+)/)[1]);
    var minutes = Number(time.match(/:(\d+)/)[1]);
    var AMPM = time.match(/\s?([AaPp][Mm]?)$/)[1];
    var pm = ['P', 'p', 'PM', 'pM', 'pm', 'Pm'];
    var am = ['A', 'a', 'AM', 'aM', 'am', 'Am'];

  if (pm.indexOf(AMPM) >= 0 && hours < 12) hours = hours + 12;
  if (am.indexOf(AMPM) >= 0 && hours == 12) hours = hours - 12;
    return (60 * hours + minutes);
}


/* Checks whether adding a section to the current schedule will still make it valid */
function isValidSchedule(sectionToAdd, schedule){
  for (otherClass of schedule){
    // console.log(otherClass.Number + " " + otherClass.Times);
    // console.log(sectionToAdd.Number + " " + sectionToAdd.Times);
    // console.log("\n-----------------------\n")
    if(overlap(otherClass.Times, sectionToAdd.Times)){
      return false;
    }
  }
  return true;
}

/* Recursive brute-force to find all possible valid schedules from the given sections */
function findPossibleSchedules(classes, list, schedule) {
  if (classes.length == 0){
    list.push(schedule);
    return ;
  }
  for (section of classes[0]){
    if (isValidSchedule(section, schedule)){
      newSchedule = schedule.slice();
      newSchedule.push(section);
      findPossibleSchedules(classes.slice(1), list, newSchedule)
    }
  }
}

/* Filters sections by restrictions, i.e. if a restriction conflicts with a section it is purged. Then it populates a global variable with the possible schedules. */
function findAllSchedules(classes, restrictions) {
  classes = parseAllTimes(classes);
  var list = [];
  var newClasses = [];
  for(var i = 0; i < classes.length; i++){
    types = {};
    for(var j = 0; j < classes[i].length; j++){
      section = classes[i][j];
      // section.Times = JSON.parse(section.Times);
      if(section["Type"] in types){
        types[section["Type"]].push(section)
      }
      else{
        types[section["Type"]] = [section];
      }
    }
    for(var key in types){
      newClasses.push(types[key]);
    }
  }
  newClasses = filterRestrictions(newClasses, restrictions);
  if(newClasses.length == 0){
    allSchedules = list;
    return ;
  }
  findPossibleSchedules(newClasses, list, []);
  allSchedules = list;
}

/* Filters sections by restrictions, i.e. if a restriction conflicts with a section it is purged. */
function filterRestrictions(classes, restrictions) {
  let newClasses = []
  for(course of classes){
    newClasses.push([]);
  }
  let i = 0;
  for(let course of classes){
    for(let section of course){
      // console.log("---------------");
      let confict = false;
      section.Times = JSON.parse(removeOuter(JSON.stringify(section.Times)).replace(/\\/g, ''));
      for(let day in section.Times){
        // console.log(section.Times);
        for(let restriction of restrictions){
          if(section.Times[day] == "TBD"){
            break;
          }
          // console.log(day);
          // console.log(section.Times[day]);
          if(overlapTimes(convert(day, section.Times[day]), restriction)){
            // console.log(section.CRN);
            confict = true;
            break;
          }
        }
      }
      if(!confict){
        // console.log(section.CRN);
        newClasses[i].push(section);
      }
    }
    if(newClasses[i].length == 0){
      return [];
    }
    i++;
  }
  return newClasses;
}


function parseTimes(times) {
  // console.log(times);
  let res = "";
  times = JSON.stringify(times);
  if (times.includes(',')) {
    for (let time of times.split(',')) {
      let finalTime = parseTimeOut(time);
      if (finalTime == "TBD") {
        time = finalTime;
        continue;
      }
      res += finalTime + "\n";
    }
  } else {
    let finalTime = parseTimeOut(times);
    if (finalTime == "TBD") {
      time = finalTime;
    }
    res += finalTime + "\n";
  }

  res = res.substring(0,res.length-1);

  res = res.replace(/\\/g, '');
  // console.log(strToJSON(res));
  return strToJSON(res);
}

function strToJSON(res) {
  let times = res.split("\n");
  let temp = {};
  for (let time of times) {
    // console.log(time);
    if (time == "") {
      temp["T"] = "TBD";
      return temp;
    }
    let splitTime = time.split(" ");
    temp[splitTime[0]] = splitTime[1];
  }
  return temp;
}

function parseAllTimes(courses) {
  for (let row of courses) {
    for (let row2 of row) {
      row2.Times = parseTimes(row2.Times);
    }
  }
  return courses;
}

function parseTimeOut(time) {
  if (time.includes("TBD")) {
    return "TBD";
  }
  let arr = time.split(":");
  let day = arr[0];
  day = removeOuter(day);


  let actTime = arr.splice(1).join(`:`);
  actTime = removeOuter(actTime);
  if (actTime == "TBD") {
    return "TBD";
  }

  return day + " " + actTime;
}

function removeOuter(str) {
  return str.substring(str.indexOf(`"`)+1, str.lastIndexOf(`"`));
}
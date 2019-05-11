/* Checks if the two time objects overlap */
function overlap(times1, times2) {
  times1 = JSON.parse(times1.replace(/\\/g, ''));
  times2 = JSON.parse(times2.replace(/\\/g, ''));
  console.log(times1);
  console.log(times2);
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
  console.log("-------------------");
  console.log(time);
  console.log("-------------------");
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
    if(overlap(otherClass.Times, sectionToAdd.Times) || sectionToAdd.Enroll.toUpperCase() == "CLOSED"){
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
      let confict = false;
      for(let day in section.Times){
        for(let restriction of restrictions){
          if(section.Times[day] == "TBD"){
            break;
          }
          if(overlapTimes(convert(day, section.Times[day]), restriction)){
            confict = true;
            break;
          }
        }
      }
      if(!confict){
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


// findAllSchedules()
let tempTime = JSON.parse(`[[{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"001","CRN":"40025","Title":"Techniques of Speaking","Times":"{\\\"M\\\":\\\"09:00am-09:50am\\\",\\\"W\\\":\\\"09:00am-09:50am\\\",\\\"F\\\":\\\"09:00am-09:50am\\\"}","Instructor":"STAFF","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"3","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"001\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"002","CRN":"40026","Title":"Techniques of Speaking","Times":"{\\\"T\\\":\\\"09:30am-10:50am\\\",\\\"R\\\":\\\"09:30am-10:50am\\\"}","Instructor":"Richard J Forney","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"5","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"002\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"003","CRN":"40027","Title":"Techniques of Speaking","Times":"{\\\"M\\\":\\\"11:00am-11:50am\\\",\\\"W\\\":\\\"11:00am-11:50am\\\",\\\"F\\\":\\\"11:00am-11:50am\\\"}","Instructor":"Joan W Blumberg","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"10","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"003\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"004","CRN":"40028","Title":"Techniques of Speaking","Times":"{\\\"T\\\":\\\"11:00am-12:20pm\\\",\\\"R\\\":\\\"11:00am-12:20pm\\\"}","Instructor":"Alexander R Jenkins","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"16","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"004\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"005","CRN":"40029","Title":"Techniques of Speaking","Times":"{\\\"M\\\":\\\"10:00am-10:50am\\\",\\\"W\\\":\\\"10:00am-10:50am\\\",\\\"F\\\":\\\"10:00am-10:50am\\\"}","Instructor":"Joan W Blumberg","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"1","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"005\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"010","CRN":"40084","Title":"Techniques of Speaking","Times":"{\\\"W\\\":\\\"07:00pm-09:50pm\\\"}","Instructor":"Joan W Blumberg","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"15","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"010\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"006","CRN":"40088","Title":"Techniques of Speaking","Times":"{\\\"T\\\":\\\"12:30pm-01:50pm\\\",\\\"R\\\":\\\"12:30pm-01:50pm\\\"}","Instructor":"Ernest A Hakanen","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"8","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"006\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"007","CRN":"40132","Title":"Techniques of Speaking","Times":"{\\\"T\\\":\\\"02:00pm-03:20pm\\\",\\\"R\\\":\\\"02:00pm-03:20pm\\\"}","Instructor":"Richard J Forney","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"11","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"007\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"008","CRN":"40207","Title":"Techniques of Speaking","Times":"{\\\"M\\\":\\\"03:00pm-03:50pm\\\",\\\"W\\\":\\\"03:00pm-03:50pm\\\",\\\"F\\\":\\\"03:00pm-03:50pm\\\"}","Instructor":"STAFF","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"2","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"008\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"009","CRN":"40251","Title":"Techniques of Speaking","Times":"{\\\"M\\\":\\\"02:00pm-02:50pm\\\",\\\"W\\\":\\\"02:00pm-02:50pm\\\",\\\"F\\\":\\\"02:00pm-02:50pm\\\"}","Instructor":"STAFF","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"0","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"009\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Online","Section":"900","CRN":"40384","Title":"Techniques of Speaking","Times":"{\\\"T\\\":\\\"TBD\\\",\\\"B\\\":\\\"TBD\\\",\\\"D\\\":\\\"TBD\\\"}","Instructor":"Rosemary E Rys","Building":"TBD","Room":"TBD","Campus":"Online","Credits":"3.00","Enroll":"4","Max_Enroll":"20","Section_Comments":"Online students only","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"900\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Online","Section":"901","CRN":"40385","Title":"Techniques of Speaking","Times":"{\\\"T\\\":\\\"TBD\\\",\\\"B\\\":\\\"TBD\\\",\\\"D\\\":\\\"TBD\\\"}","Instructor":"Julia H May","Building":"TBD","Room":"TBD","Campus":"Online","Credits":"3.00","Enroll":"5","Max_Enroll":"20","Section_Comments":"Online students only","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"901\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "},{"Term":"Summer Quarter 18-19","College":"Arts and Sciences","Subject":"COM","Number":"230","Type":"Lecture","Method":"Face To Face","Section":"011","CRN":"42276","Title":"Techniques of Speaking","Times":"{\\\"M\\\":\\\"12:00pm-12:50pm\\\",\\\"W\\\":\\\"12:00pm-12:50pm\\\",\\\"F\\\":\\\"12:00pm-12:50pm\\\"}","Instructor":"Joan W Blumberg","Building":"TBD","Room":"TBD","Campus":"University City","Credits":"3.00","Enroll":"3","Max_Enroll":"17","Section_Comments":"None","Textbook":"http://drexel.bncollege.com/webapp/wcs/stores/servlet/TBListView?cm_mmc=RI-_-457-_-1-_-A&catalogId=10001&storeId=31061&langId=-1& termMapping=N&courseXml=<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?>   <textbookorder> <school id=\\\"457\\\"/>  <campus name=\\\"UC\\\"> <courses>  <course num=\\\"230\\\" dept=\\\"COM\\\" sect=\\\"011\\\" term=\\\"A19\\\" />  </courses>  </campus> </textbookorder>","Description":"A workshop course in improving public speaking skills. Provides experience in speeches of explanation, persuasion, and argument. "}]]`);
findAllSchedules(tempTime, []);

function parseTimes(times) {
  // console.log(times);
  let res = "";
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
  console.log(strToJSON(res));
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
      parseTimes(row2.Times);
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
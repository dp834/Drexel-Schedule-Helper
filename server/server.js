#! /usr/bin/node
//sets database properly if run local vs server
if(process.env.GOOGLE_HOST === undefined){
	// require('dotenv').config();
	let dotenv = require('dotenv');
	dotenv.load();
}
//using express
var express = require("express");

let nodemailer = require('nodemailer');

const util = require('util');
const exec = util.promisify(require('child_process').exec);



var app = express();
//home path
app.use(express.static("server/"));
//use port specified
app.set('port', (process.env.PORT || 8080));
//bodyparser for post requests
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//to get files on server
var fs = require("fs");


var stringify = require('json-stringify');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let transporter = nodemailer.createTransport({
	service: 'Gmail',
	host: 'smtp.gmail.com',
	port:587,
	secure: false,
	auth: {
	    user: process.env.GMAIL_USER,
	    pass: process.env.GMAIL_PASS
  	}
});

//connect to mysql database
var mysql = require("mysql");
let config = {
	"connectionLimit": 20,
	"host": process.env.SQL_HOST,
	"user": process.env.SQL_USER,
	"password": process.env.SQL_PASS,
	"database": process.env.SQL_DB
}

//using pools
let pool = mysql.createPool(config);

//logging purposes
pool.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId);
});
//logging purposes
pool.on('enqueue', function () {
  console.log('Waiting for available connection slot');
});
//logging purposes
pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});

//homepage
app.get("/",(req,res)=>{
	res.write(fs.readFileSync(__dirname + "/resources/html/index.html"));
	res.end();
});

//homepage
app.get("/index", (req,res)=>{
	res.write(fs.readFileSync(__dirname + "/resources/html/index.html"));
	res.end();
});

//select courses page
app.get("/select", (req,res)=>{
	res.write(fs.readFileSync(__dirname + "/resources/html/select.html"));
	res.end();
});

//tms page
app.get("/table", (req,res)=>{
	res.write(fs.readFileSync(__dirname + "/resources/html/table.html"));
	res.end();
});

//about page
app.get("/about", (req,res)=>{
	res.write(fs.readFileSync(__dirname + "/resources/html/about.html"));
	res.end();
});

//feedback page
app.get("/feedback", (req,res)=>{
	res.write(fs.readFileSync(__dirname + "/resources/html/feedback.html"));
	res.end();
});



app.get("/email", function(req, res){
	let fromName = req.query.name;
	let from = req.query.from;
	let subject = req.query.subject;
	let message = req.query.message;

	message += "\n\n from\n-" + fromName + "\n-" + from;


	let mailOptions = {
	  from: process.env.GMAIL_USER,
	  to: process.env.GMAIL_USER,
	  subject: subject,
	  text: message+"\n\n"+from
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
	res.redirect('/index');
});

//api for getting term information
app.get('/tms', function(req, res) {
	if (Object.keys(req.query).length === 0) {
		res.status(400);
		res.send("No parameters provided");
	} else {
		var query = "SELECT * FROM courses WHERE";
		var params = [];
		console.log("TMS Get Request\nParameters Sent: " + JSON.stringify(req.query));
		if(req.query.term !== undefined) params.push(["term", addQuotes(pool.escape(req.query.term))]);
		if(req.query.college !== undefined) params.push(["college", addQuotes(pool.escape(req.query.college))]);
		if(req.query.subject !== undefined) params.push(["subject", addQuotes(pool.escape(req.query.subject))]);
		if(req.query.number !== undefined) params.push(["number", addQuotes(pool.escape(req.query.number))]);
		if(req.query.type !== undefined) params.push(["type", addQuotes(pool.escape(req.query.type))]);
		if(req.query.method !== undefined) params.push(["method", addQuotes(pool.escape(req.query.method))]);
		if(req.query.section !== undefined) params.push(["section", addQuotes(pool.escape(req.query.section))]);
		if(req.query.crn !== undefined) params.push(["crn", addQuotes(pool.escape(req.query.crn))]);
		if(req.query.description !== undefined) params.push(["description", addQuotes(pool.escape(req.query.description))]);
		if(req.query.times !== undefined) params.push(["times", addQuotes(pool.escape(req.query.times))]);
		if(req.query.instructor !== undefined) params.push(["instructor", addQuotes(pool.escape(req.query.instructor))]);

		for (var i=0; i<params.length; i++) {
			if (query.length === 27) {
				query += " " + params[i][0] + "=" + params[i][1];
			} else {
				query += " AND " + params[i][0] + "=" + params[i][1];
			}
		}

		query += ";";
		console.log("Query: " + query);

		console.log(query);
		pool.query(query, (err,rows, field)=>{
			if(err){
				res.status(300);
				res.write("Error with query" + err);
				res.end();
				return;
			}
			res.status(200);

			let temp = replaceAll(rows);
			res.json(temp);
			res.end();
		});
	}
});

function replaceAll(str) {
	let find = `\'`;
	let replace = '';
	let temp = JSON.stringify(str);
    return JSON.parse(temp.replace(new RegExp(find, 'g'), replace));
}

//Used to get resources for dynamic page allocations
app.post("/render", (req,res)=>{
	console.log("Entered render with: " + JSON.stringify(req.body));
	if(req.body.page === undefined){
		res.status(200);
		res.write("Could not find page");
		res.end();
		return;
	}
	switch(req.body.page){
		case("index"):
			res.write(fs.readFileSync(__dirname + "/resources/html/index.html"));
			break;
		case("select"):
			res.write(fs.readFileSync(__dirname + "/resources/html/select.html"));
			break;
		case("calendar"):
			res.write(fs.readFileSync(__dirname + "/resources/html/calendar.html"));
			break;
		case("table"):
			res.write(fs.readFileSync(__dirname + "/resources/html/table.html"));
			break;
		case("about"):
			res.write(fs.readFileSync(__dirname + "/resources/html/about.html"));
			break;
		case("feedback"):
			res.write(fs.readFileSync(__dirname + "/resources/html/feedback.html"));
			break;
		default:
			res.status(200);
			res.write("Could not find page");
	}
	res.end();
});

//gets all the sections for given courses given the course ie CS 275 and the term ie Spring Quarter 18-19
app.post("/classes", (req, res)=>{
	console.log("Entered classes with:\n" + JSON.stringify(req.body));
	let query = "select * from courses where term=" + `''` + pool.escape(req.body.term) + `''` + "AND (";
	let coursesRes = [];
	let map = {};
	let counter = 0;
	for(course in req.body.courses){
		map[req.body.courses[course]] = counter;
		coursesRes[counter] = [];
		counter++;
		let split = req.body.courses[course].split(" ");
		query+= "(subject=" + `''` + pool.escape(split[0]) + `''` + " AND number=" + `''` + pool.escape(split[1]) + `''` +") OR";
	}
	query = query.slice(0,-2);
	query += ");"

	console.log(query);
	pool.query(query, (err,rows,field)=>{
		if(err){
			res.status("200");
			console.log("Error with Query:" + query);
			res.write("Error with query");
			res.end();
			return;
		}
		for(row in rows){
			var pointer = map[removeQuotes(rows[row].Subject) + " " + removeQuotes(rows[row].Number)];
			if(pointer !== undefined){
				coursesRes[pointer].push(rows[row]);
			}
		}
		res.write(JSON.stringify(replaceAll(coursesRes)));
		res.end();	
	})
});

function addQuotes(str) {
	return `''` + str + `''`;
}

function removeQuotes(str) {
	console.log(str);
	return str.substring(1, str.length-1);
}

//gets all terms 
app.get("/allTerms", (req,res)=>{
	console.log("Entered allTerms");
	query = "SELECT DISTINCT term FROM courses;";
	console.log(query);
	pool.query(query, (err,rows, field)=>{
		if(err){
			res.status(200);
			res.write("Error with query");
			res.end();
			return;
		}
		let temp = replaceAll(rows);
		res.json(temp);
		res.end();
	});
});

//gets all instructors 
app.get("/allInstructors", (req,res)=>{
	console.log("Entered allInstructors");
	if(req.query.term == undefined){
		res.status(200);
		res.write("Error with query");
		res.end();
		return;	
	}
	query = 'SELECT DISTINCT instructor as ID from courses where term=' + `''` + pool.escape(req.query.term) + `''` + ' ORDER BY ID';
	console.log(query);
	pool.query(query,(err,rows,fields)=>{
		if(err){
			res.status(200);
			res.write("Error with query");
			res.end();
			return;
		}
		let temp = replaceAll(rows);
		res.json(temp);
		res.end();
	});
});

//gets all the classes offered given the term
app.get("/allClasses", (req,res)=>{
	console.log("Entered allClasses");
	if(req.query.term == undefined){
		res.status(200);
		res.write("Error with query");
		res.end();
		return;	
	}
	query = 'SELECT DISTINCT CONCAT(subject, " ", number) as ID from courses where term=' + `''` +  pool.escape(req.query.term) + `''` + ' ORDER BY ID';
	console.log(query);
	pool.query(query,(err,rows,fields)=>{
		if(err){
			res.status(200);
			res.write("Error with query");
			res.end();
			return;
		}
		let temp = replaceAll(rows);
		res.json(temp);
		res.end();
	});
});



app.get("/coursesFile", (req,res)=>{
	let allCourses = require('../scraper/courses.json');
	res.json(allCourses);
	res.end();
});


app.get("/runScraper", (req,res)=>{
	var exec1 = require('child_process').exec;
	var scraperProcess = exec1('cd server ; node ../scraper/scraper.js');
	scraperProcess.stdout.on('data', function(data) {
		console.log(data); 
	});
	res.end();
});




app.get("/pushDatabase",(req,res)=>{
	req.setTimeout(0);
	console.log("Calling pushDataToDatabase");
	pushDataToDatabase();
	console.log("Finished pushing to database");
});

//used to populate database, currently done manually
async function pushDataToDatabase(){
	console.log("Entered pushDataToDatabase");
	let file = __dirname + "/../scraper/courses.json";
	// let allCourses = JSON.parse(fs.readFileSync(file));
	let allCourses = require(file);
	if(allCourses === undefined){
		console.log("pushDataToDatabase Failed to get courses from file: " + file);
		return;
	}
	let totalRequests = 0;
	let actualRequests = 0;
	console.log("File read");
	let values = [];
	for (term in allCourses) {
		for (college in allCourses[term].colleges) {
			for (subject in allCourses[term].colleges[college].subjects) {
				for (courseLink in allCourses[term].colleges[college].subjects[subject].courseLinks) {


					
					let temp = [];
					let item = allCourses[term].colleges[college].subjects[subject].courseLinks[courseLink].courses;
					temp.push(pool.escape(allCourses[term].name));
					temp.push(pool.escape(allCourses[term].colleges[college].name));
					temp.push(pool.escape(item.Subject));
					temp.push(pool.escape(item.Number));
					temp.push(pool.escape(item.Type));
					temp.push(pool.escape(item.Method));
					temp.push(pool.escape(item.Section));
					temp.push(pool.escape(item.CRN));
					temp.push(pool.escape(item.Title));
					temp.push(pool.escape(JSON.stringify(item.Times)));
					temp.push(pool.escape(item.Instructor));
					temp.push(pool.escape(item.Building));
					temp.push(pool.escape(item.Room));
					temp.push(pool.escape(item.Campus));
					temp.push(pool.escape(item.Credits));
					temp.push(pool.escape(item.Enroll));
					temp.push(pool.escape(item.Max_Enroll));
					temp.push(pool.escape(item.Section_Comments));
					temp.push(pool.escape(item.Textbook));
					temp.push(pool.escape(item.Description));

					values.push(temp);
					// console.log(temp);

					totalRequests++;
					actualRequests++;		


				}
			}
		}
	}
	let query = "INSERT IGNORE INTO courses (term, college, subject, number, type, method, section, crn, title, times, instructor, building, room, campus, credits, enroll, max_enroll, section_comments, textbook, description) VALUES ?";
	/* Using this stackoverflow -> https://stackoverflow.com/questions/8899802/how-do-i-do-a-bulk-insert-in-mysql-using-node-js */
	pool.query(query, [values], (err,rows,field)=>{
		if(err && !String(err).includes("ER_DUP_ENTRY")){
			console.log("Error with query\n" + err);
		}
	});
	console.log("totalRequests: " + totalRequests);
	console.log("actualRequests: " + actualRequests);
}

//start application to listen
app.listen(app.get('port'));
console.log("Listening on port:" + app.get('port'));

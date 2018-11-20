#! /usr/bin/node

var express = require("express");

var app = express();
app.use(express.static("."));

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

var fs = require("fs");

//sql details
var mysql = require("mysql");
var con = mysql.createConnection({
	host:  "localhost",
	user:  "root",
	password: "root",
	database: "ScheduleBoy",
	port: 3306,
});

con.connect((err)=>  {
	if (err)  {
		console.log("Error connecting to database\n" + err); 
		process.exit();
	}
	console.log("Database successfully connected");  
	pushDataToDatabase();
});




function pushDataToDatabase(){
	console.log("Entered pushDataToDatabase");
	let file = "../scraper/testing123.txt";
	let allCourses = JSON.parse(fs.readFileSync(file));
	if(allCourses === undefined){
		console.log("pushDataToDatabase Failed to get courses from file: " + file);
		return;
	}
	console.log("File read");
	for(term in allCourses){
		for(college in allCourses[term].colleges){
			for(subject in allCourses[term].colleges[college].subjects){
				for(course in allCourses[term].colleges[college].subjects[subject].courses){
					let item = allCourses[term].colleges[college].subjects[subject].courses[course];
					let query = "INSERT INTO courses (term, college, subject, number, type, method, section, crn, description, times, instructor) VALUES (";
					query += con.escape(allCourses[term].name);
					query += ", " + con.escape(allCourses[term].colleges[college].name);
					query += ", " + con.escape(item.Subject);
					query += ", " + con.escape(item.Number);
					query += ", " + con.escape(item.Type);
					query += ", " + con.escape(item.Method);
					query += ", " + con.escape(item.Section);
					query += ", " + con.escape(item.CRN);
					query += ", " + con.escape(item.Description);
					query += ", " + con.escape(JSON.stringify(item.Times));
					query += ", " + con.escape(item.Instructor);
					query += ");";
					
					if(con.escape(item.Section).length >15){
						console.log(query);
					}

					con.query(query,
					(err,rows,field)=>{
							if(err && !String(err).includes("ER_DUP_ENTRY")){
								console.log("Error with query\n" + err);
							}
						}
					);
				}
			}
		}
	}
	console.log("DONE");
}

//starts the listener
app.listen(8080);
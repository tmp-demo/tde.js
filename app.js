var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");
var express = require("express");
var path = require("path");
var yargs = require("yargs");

module.exports = function(options, callback) {
	var app = express();

	app.use(bodyParser.json());

	require("./project").init(options, app);
	require("./asset").init(options, app);

	app.use(express.static(__dirname + "/public"));

	app.use(errorHandler());

	return callback(null, app);
};

if (require.main === module) {
	var options = yargs
		.option("d", {
			alias: "data",
			default: path.resolve(__dirname, "data"),
			describe: "Data repertory",
		})
		.option("e", {
			alias: "export",
			default: path.resolve(__dirname, "export"),
			describe: "Export repertory",
		})
		.option("g", {
			alias: "git",
			default: false,
			describe: "Commit changes automatically",
		})
		.option("p", {
			alias: "port",
			default: process.env.PORT || 8084,
			describe: "Port to listen to",
		})
		.option("t", {
			alias: "templates",
			default: path.resolve(__dirname, "data_templates"),
			describe: "Data templates repertory",
		})
		.help("help")
		.alias("h", "help")
		.argv;

	module.exports(options, function(err, app) {
		if (err) throw err;

		app.listen(options.port, function() {
			console.log("Server listening on port %d in mode %s.", options.port, app.get("env"));
		});
	});
}

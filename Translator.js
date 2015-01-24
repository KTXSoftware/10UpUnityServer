"use strict";

var fs = require('fs');
var http = require('http');
var https = require('https');

var secret = encodeURIComponent(fs.readFileSync('secret.txt'));
var token = null;

function updateToken(callback) {
	var options = {
		hostname: 'datamarket.accesscontrol.windows.net',
		port: 443,
		path: '/v2/OAuth2-13',
		method: 'POST'
	};
	var req = https.request(options, function (res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
			token = JSON.parse(chunk);
			callback();
		});
	});

	req.on('error', function (e) {
		console.log('Problem with request: ' + e.message);
	});

	req.write("grant_type=client_credentials&client_id=ten_up_unity&client_secret=" + secret + "&scope=http://api.microsofttranslator.com");
	req.end();
}

function translateWithToken(text, to, callback) {
	var transOptions = {
		hostname: 'api.microsofttranslator.com',
		port: 80,
		path: '/v2/Http.svc/Translate?text=' + encodeURIComponent(text) + '&to=' + to,
		method: 'GET',
		headers: {
			Authorization: 'Bearer ' + token.access_token
		}
	};
	var transRequest = http.request(transOptions, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Translate_BODY: ' + chunk);
			callback(chunk.substring(chunk.indexOf('>') + 1, chunk.lastIndexOf('<')));
		});
	});
	transRequest.end();
}

exports.translate = function (text, to, callback) {
	if (token === null) {
		updateToken(function () {
			translateWithToken(text, to, callback);
		});
	}
	else {
		translateWithToken(text, to, callback);
	}
};

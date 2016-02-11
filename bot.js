/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


var Botkit = require('botkit')
var os = require('os');
var url = require('url');

var redis = require('botkit-storage-redis');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var redisStorage = redis({
    namespace: 'botkit-example',
    host: redisURL.hostname,
    port: redisURL.port,
    auth_pass: redisURL.auth.split(":")[1]
});

var controller = Botkit.slackbot({
  debug: false,
  storage: redisStorage
});

var bot = controller.spawn(
  {
    token:process.env.SLACK_TOKEN
  }
).startRTM();

var moment = require('moment-timezone');
var github = require('githubot');
var assignees = process.env.GITHUB_ASSIGNEES.split(',');
var repository = process.env.GITHUB_REPOSITORY;

controller.hears(['issues (.*)'], 'direct_mention', function(bot, message) {
    var matches = message.text.match(/issues (.*)/i);
    var command = matches[1];

    // 昨日作成されたIssue
    if (command == 'report') {
        var yesterday = moment().tz('Asia/Tokyo').startOf('day').add(-1, 'days');
        github.get('https://api.github.com/repos/' + repository + '/issues?per_page=100&since=' + yesterday.toISOString(), function(issues) {
                var text = 'Issue that was created yesterday (' + yesterday.format('YYYY/MM/DD') + ') : ' + issues.length + '\n\n';
                var texts = [];

                issues.forEach(function(issue) {
                    texts.push('[' + issue.number + '] ' + issue.title + ' (' + issue.user.login + ')');
                });
                text += texts.join('\n');
                bot.reply(message, text);
        });
    }

    // アサインされたIssue
    if (command == 'assign') {
        assign_issues = {};
        assignees.forEach(function(assignee) {
            assign_issues[assignee] = [];
        });
        github.get('https://api.github.com/repos/' + repository + '/issues?per_page=100', function(issues) {
                var text = '';
                issues.forEach(function(issue) {
                    if (issue.assignee && issue.assignee.login in assign_issues) {
                        assign_issues[issue.assignee.login].push('[' + issue.number + '] ' + issue.title);
                    }
                });

                for (assignee in assign_issues) {
                    text += assignee + ' : ' + assign_issues[assignee].length + '\n' + assign_issues[assignee].join('\n') + '\n\n';
                }

                bot.reply(message, text);
         });
    }
})

// To keep Heroku's free dyno awake
var http = require('http');
http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Ok, dyno is awake.');
}).listen(process.env.PORT || 5000);

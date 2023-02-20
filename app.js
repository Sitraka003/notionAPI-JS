let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let cron = require("node-cron");

require('dotenv').config();

let indexRouter = require('./routes/index');
const notion = require("./services/notion");

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


// Set the database ID and status property name
const databaseId = process.env.DATABASE_ID;
const statusPropertyName = 'Status';
const status = {
  DONE: "Done",
  ARCHIVED: "Archived"
}

// Define a function to update tasks
async function updateTasks() {
  // Retrieve all tasks in the database that have the status "Done"
  const tasks = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        {
          property: statusPropertyName,
          select: {
            equals: status.DONE,
          },
        },
      ],
    },
  });

  // Update the status of each task to "Archived"
  await Promise.all(
    tasks.results.map(async (task) => {
      await notion.pages.update({
        page_id: task.id,
        properties: {
          [statusPropertyName]: {
            select: {
              name: status.ARCHIVED,
            },
          },
        },
      });
    })
  );
}

// Define a cron job to run the updateTasks function every day at 11PM
cron.schedule("0 23 * * *'", () => {
  (updateTasks)();
});
module.exports = app;

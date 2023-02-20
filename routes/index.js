const express = require('express');
const notion = require("../services/notion");
const router = express.Router();

const DATABASE_ID = process.env.DATABASE_ID ?? "";
const statusPropertyName = 'Status';


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.put('/task', async function (req, res) {
  const {sourceStatus, targetStatus, number} = req.body;
  try {
    const tasks = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        and: [
          {
            property: statusPropertyName,
            select: {
              equals: sourceStatus,
            },
          },
        ],
      },
    });

    const selectedTasks = tasks.results.slice(0, number);

    const result = await Promise.all(
      selectedTasks.map(async (task) => {
        await notion.pages.update({
          page_id: task.id,
          properties: {
            [statusPropertyName]: {
              select: {
                name: targetStatus,
              },
            },
          },
        });
      })
    );

    res.json({
      status: true,
      number,
      result
    });
  } catch (e) {
    res.json({
      status: false,
      error: e
    });
  }
})

module.exports = router;

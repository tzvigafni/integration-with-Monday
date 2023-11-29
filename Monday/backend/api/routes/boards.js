const express = require('express');
const router = express.Router();

const connection = require("../../config/connection");

// get all boards
router.post('/', async (req, res) => {
    const Query = `
    SELECT * FROM integrations 
    WHERE platform = 'monday' 
    AND installation_status = 1
    ORDER BY id DESC
    `;

    const aa = connection.query(Query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send("Not registered!");
        } else {
            if (results.length > 0) {
                let atoken = results[0].platform_token;

                let myHeaders = new Headers();

                myHeaders.append("Authorization", `Bearer ${atoken}`);
                myHeaders.append("Content-Type", "application/json");

                let raw = JSON.stringify({
                    "query": "query { boards { name id }}"
                });

                let requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow',
                };
                fetch("https://api.monday.com/v2", requestOptions)
                    .then(response => response.json())
                    .then(result => { res.send(result.data.boards) })
                    .catch(error => {
                        console.log('error --', error)
                        res.send(error)
                    });
            }
        }
    })
});

// get all colums in num board
router.post('/:boardId', (req, res) => {
    const boardId = parseInt(req.params.boardId);
    console.log(boardId);

    if (!boardId) {
        return res.status(404).json({ error: 'Board not found' });
    }

    const Query = `
    SELECT * FROM integrations 
    WHERE platform = 'monday' 
    AND installation_status = 1
    ORDER BY id DESC
    `;

    const aa = connection.query(Query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send("Not registered!");
        } else {
            console.log(results);
            if (results.length > 0) {
                let atoken = results[0].platform_token;


                var myHeaders = new Headers();
                myHeaders.append("Authorization", `Bearer ${atoken}`);
                myHeaders.append("Content-Type", "application/json");

                var raw = JSON.stringify({
                    "query": `query { boards (ids: ${boardId}) {columns {id title}}} `
                });

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: raw,
                    redirect: 'follow'
                };

                fetch("https://api.monday.com/v2", requestOptions)
                    .then(response => response.json())
                    .then(result => res.send(result.data.boards[0].columns))
                    .catch(error => console.log('error', error));
            }
        }
    })
});

// save in database num of board
router.post('/saveNumBoard/:boardId', (req, res) => {

    const boardId = parseInt(req.params.boardId);

    if (!boardId) {
        return res.status(404).json({ error: 'Board not found' });
    }

    const numBoardValue = JSON.stringify({ boardId });

    const Query = `
    SELECT * FROM integrations 
    WHERE platform = 'monday' 
    AND installation_status = 1
    ORDER BY id DESC
    `;

    const aa = connection.query(Query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send("Not registered!");
        } else {
            console.log(results);
            if (results.length > 0) {
                let installation_token = results[0].installation_token;

                const insertNumBoardQuery = `
    UPDATE integrations  
    SET platform_settings=?
    WHERE platform='monday' 
    AND installation_token=?;
    `;

                connection.query(insertNumBoardQuery, [numBoardValue, installation_token],
                    (err, results) => {
                        if (err) {
                            console.log(err);
                            res.status(500).send("Server error");
                        } else {
                            console.log("Data updated successfully!");
                            res.status(200).send("updated")
                        }
                    }
                );
            }
        }
    })
});

module.exports = router;
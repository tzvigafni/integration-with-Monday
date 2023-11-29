const express = require('express');

const cors = require('cors');

const dotenv = require("dotenv");
dotenv.config();

const axios = require('axios');
const mondaySdk = require("monday-sdk-js");
const monday = mondaySdk();
const connection = require("./config/connection");

const boardsRoutes = require('./api/routes/boards');

const { v4: uuidv4 } = require('uuid');

const path = require('path');

const app = express();
const port = 8000;

app.use(cors());

const bodyParser = require('body-parser');

app.use(bodyParser.json()); // קביעת ה-body parser עבור JSON

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = `${process.env.URL}/oauth/callback`; 

//start
app.post('/requestInstallationURL', (req, res) => {
    const { user_id, user_type, plugin_id } = req.body || {};
    const installationToken = uuidv4();
    const platform = "monday";
    const installationStatus = 0;

    const settings = {
        // board_id: "",
        // incoming_call_summary_list_id: "",
        // outgoing_call_summary_list_id: "",
        // client_id: "",
    };
    const platformSettings = JSON.stringify(settings);

    const phoneDoToken = req.headers.authorization.split(' ')?.[1]

    if (!phoneDoToken) {
        console.log('Token format is incorrect');
        return res.sendStatus(401).json({ error: "Missing token" });
    }

    const insertTokenQuery = `
    INSERT INTO integrations (installation_token,phonedo_business_id,user_type,plugin_id,platform, platform_settings,phonedo_token,installation_status)
    VALUES (?,?,?,?,?,?,?,?);
    `;

    connection.query(insertTokenQuery,
        [installationToken, user_id, user_type, plugin_id, platform, platformSettings, phoneDoToken, installationStatus],
        (err, results) => {
            if (err) {
                console.log(err);
                res.status(500).send("Server error");
            } else {
                console.log("Data sent and saved successfully!");
                console.log("installationToken", installationToken);
                res.status(200).json({
                    url: `${process.env.URL}/login?installationToken=${installationToken}`,
                });
            }
        }
    );
});

// נתיב להתחברות ל-Monday.com
app.get('/login', (req, res) => {
    const installationToken = req.query.installationToken || 'default value';
    const authUrl = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${installationToken}`;
    res.redirect(authUrl);
});

app.use(express.static('build'));

// נתיב להתחברות ל-Monday.com והפניה חזרה אחרי האוטוריזציה
app.get('/oauth/callback', async (req, res) => {
    const authCode = req.query.code;
    const state = req.query.state;
    console.log("authCode: ", authCode);
    console.log("state: ", state);

    try {
        // ביצוע בקשת POST לקבלת טוקן גישה
        const response = await fetch('https://auth.monday.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: authCode,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();

        let accessToken = data.access_token;
        console.log('Access Token:', accessToken);

        const insertTokenQuery = `
        UPDATE integrations 
        SET platform_token=?,installation_status =1
        WHERE installation_token = ?;
        `;

        connection.query(insertTokenQuery,
            [accessToken, state],
            (err, results) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Server error");
                } else {
                    console.log("Data updated successfully!");
                    // res.status(200).send("updated")
                    res.status(200).sendFile(path.join(__dirname, 'build', 'index.html'));
                }
            }
        );
    } catch (error) {
        console.error('Error during authorization:', error);
        res.send('Failed to connect to Monday.com. Please try again.');
    }
});

app.post('/addCard', async (req, res) => {

    const Query = `
    SELECT * FROM integrations 
    WHERE phonedo_business_id = ? 
    AND platform = 'monday' 
    AND installation_status = 1
    ORDER BY id DESC
    `;

    const aa = connection.query(Query,
        [req.body.businessId],
        (err, results) => {
            if (err) {
                console.log(err);
                res.status(500).send("Not registered!");
            } else {
                console.log(results);
                if (results.length > 0) {
                    let atoken = results[0].platform_token;

                    let numBoard = results[0].platform_settings.boardId;
                    console.log('numBoard => ', numBoard);

                    const data1 = req.body;
                    const data3 = `- Name: ${data1.clientInfoGivenName || ""} ${data1.clientInfoFamilyName || ""} - Email: ${data1.clientInfoEmail || ""} - Phone: ${data1.clientInfoTelephone || ""} - Status: ${data1.status || ""} - Description: ${data1.clientInfoCallPurpose || ""} - Attachments: /api/call_records/${data1.callRecords[0]?.id || ""} - Custom Fields: Phone.do Agent: ${data1.callAgent.givenName || ""} ${data1.callAgent.familyName || ""} -  phonedoInfo: leadID: ${data1.id || ""}, businessID: ${data1.businessId || ""} `;
                    console.log('data3', data3);


                    // get all columns
                    const getAllColumns = async () => {
                        var myHeaders = new Headers();
                        myHeaders.append("Authorization", `Bearer ${atoken}`);
                        myHeaders.append("Content-Type", "application/json");

                        var raw = JSON.stringify({
                            "query": `query { boards (ids: ${numBoard}) {columns {id title}}} `
                        });

                        var requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: raw,
                            redirect: 'follow'
                        };

                        try {
                            const response = await fetch("https://api.monday.com/v2", requestOptions);
                            const result = await response.json();
                            const allColumns = result.data.boards[0].columns;
                            return allColumns;
                        } catch (error) {
                            console.log('error', error);
                            return [];
                        }
                    }

                    //
                    // create column - call summaries
                    const createColumnCallSummaries = async () => {
                        var myHeaders = new Headers();
                        myHeaders.append("Authorization", `Bearer ${atoken}`);
                        myHeaders.append("Content-Type", "application/json");

                        var raw = JSON.stringify({
                            "query": `mutation{ create_column(board_id: ${numBoard}, title:\"Call Summaries\", description: \"In this column you can view call summaries at the end of the call\", column_type:long_text) {id}}`
                        });

                        var requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: raw,
                            redirect: 'follow'
                        };

                        fetch("https://api.monday.com/v2", requestOptions)
                            .then(response => response.text())
                            .then(result => {
                                console.log('call summaries', result);
                                call_summaries_column_id = result?.data?.create_column?.id;

                            })
                            .catch(error => console.log('error call summaries', error));
                    }

                    //
                    // Placing the call summary in the call summaries column
                    const insertCallSummary = async (column_id) => {
                        // let query = `mutation { create_item (board_id: $numBoard, group_id: \"topics\", item_name: \"${data1.clientInfoTelephone}\", column_values: \"{\\\"status\\\":\\\"Done\\\", \\\"call summaries\\\":\\" ${data1.clientInfoTelephone}\\"}\") { id }}`;
                        // console.log("substring",`mutation ($boardId: Int!) {create_item (board_id: $boardId, group_id: \"topics\", item_name: \"${data1.clientInfoTelephone}\" ,column_values: \"{\\\"status\\\":\\\"Done\\\", \\\"${column_id}\\\":\\" ${data2}\\"}\") {id}}\n`.substring(384,389))


                        var graphql = JSON.stringify({
                            query: `mutation ($boardId: Int!) {create_item (board_id: $boardId, group_id: \"topics\", item_name: \"${data1.clientInfoTelephone}\" ,column_values: \"{\\\"status\\\":\\\"Done\\\", \\\"${column_id}\\\":\\" ${data3}\\"}\") {id}}\n`,
                            variables: { "boardId": 1254402626 }
                        })

                        fetch("https://api.monday.com/v2", {
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${atoken}`
                            },
                            body: graphql
                            // JSON.stringify({
                            //     query: query
                            // })
                        })
                            .then(res => res.json())
                            .then(res => console.log(res))
                            .catch(error => console.log('error call summary', error));
                    }

                    //
                    // create column - answer
                    const createColumnAnswer = async () => {
                        var myHeaders = new Headers();
                        myHeaders.append("Authorization", `Bearer ${atoken}`);
                        myHeaders.append("Content-Type", "application/json");

                        var raw = JSON.stringify({
                            "query": `mutation{ create_column(board_id: ${numBoard}, title:\"Answer\", description: \"This is a column for returning an answer to the agent\", column_type:long_text) {id title description}}`
                        });

                        var requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: raw,
                            redirect: 'follow'
                        };

                        fetch("https://api.monday.com/v2", requestOptions)
                            .then(response => response.text())
                            .then((result) => {
                                console.log('answer id =>', result?.data?.create_column?.id)
                                return result?.data?.create_column?.id;
                            })
                            .catch(error => { console.log('error', error); return null; });
                    }


                    const createWhbhook = async (column_id) => {

                        let query = `query { webhooks (board_id: ${numBoard}) { id event board_id config }}`;

                        const response = await fetch("https://api.monday.com/v2", {
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `${atoken}`
                            },
                            body: JSON.stringify({
                                'query': query
                            })
                        })
                        const result = await response.json();

                        console.log('all webook - ', result);

                        if (result.length > 0) {
                            console.log('Webhook already exists!');
                            return;
                        } else {
                            console.log("webhook on cloumnd id - ", column_id)

                            var myHeaders = new Headers();
                            myHeaders.append("Authorization", `Bearer ${atoken}`);
                            myHeaders.append("Content-Type", "application/json");

                            var raw = JSON.stringify({
                                "query": `mutation {create_webhook (board_id: ${numBoard}, url: \"${process.env.URL}/monday/Webhook\", event: change_specific_column_value, config: \"{\\\"columnId\\\":\\\"${column_id}\\\", \\\"columnValue\\\":{\\\"$any$\\\":true}}\") {id board_id}}`
                            });

                            var requestOptions = {
                                method: 'POST',
                                headers: myHeaders,
                                body: raw,
                                redirect: 'follow'
                            };

                            try {
                                let response = await fetch("https://api.monday.com/v2", requestOptions);
                                const result = await response.json();
                                return result;
                            } catch (e) {
                                console.log(e)
                            }
                        }
                    }

                    const main = async () => {
                        const allColumns = await getAllColumns();
                        console.log('allColumns', allColumns);

                        let hasCallSummaries = false;
                        if (call_summaries_column_id = allColumns.find(c => c.title === 'Call Summaries')?.id) {
                            hasCallSummaries = true;
                        }

                        if (!hasCallSummaries) {
                            await createColumnCallSummaries();
                            console.log('אין ערך "Call Summaries" בתוך השדות.');
                            hasCallSummaries = false;
                        } else {
                            console.log('יש ערך "Call Summaries" בתוך השדות.');
                            hasCallSummaries = false;
                        }

                        await insertCallSummary(call_summaries_column_id);

                        if (answer_column_id = allColumns.find(c => c.title === 'Answer')?.id) {
                            hasCallSummaries = true;
                        }

                        if (!hasCallSummaries) {
                            let new_answer_column_id = await createColumnAnswer();
                            console.log("create answerr id ", new_answer_column_id);
                            answer_column_id = new_answer_column_id;
                            console.log('אין ערך "Answer" בתוך השדות.');
                            hasCallSummaries = false;
                        } else {
                            console.log('יש ערך "Answer" בתוך השדות.');
                        }

                        const Query = `
                        SELECT * FROM integrations 
                        WHERE platform = 'monday' 
                        AND installation_status = 1
                        ORDER BY id DESC
                        `;

                        const aa = connection.query(Query, async (err, results) => {
                            if (err) {
                                console.log(err);
                                res.status(500).send("Not registered!");
                            } else {
                                if (results.length > 0) {
                                    let installation_token = results[0].installation_token;
                                    let platform_settings = results[0].platform_settings

                                    if (!platform_settings.idWebhook) {

                                        let webhookresult = await createWhbhook(answer_column_id);
                                        console.log("webhookresult", webhookresult);

                                        const idWebhook = webhookresult.data.create_webhook.id;

                                        platform_settings.idWebhook = idWebhook;
                                        console.log(JSON.stringify(platform_settings));

                                        const insertIdWebhookQuery = `
                                        UPDATE integrations  
                                        SET platform_settings=?
                                        WHERE platform='monday' 
                                        AND installation_token=?;
                                        `;

                                        connection.query(insertIdWebhookQuery, [JSON.stringify(platform_settings), installation_token],
                                            (err, results) => {
                                                if (err) {
                                                    console.log(err);
                                                    res.status(500).send("Server error");
                                                } else {
                                                    console.log("Data updated id webhook successfully!");
                                                    res.status(200).send("updated")
                                                }
                                            }
                                        );
                                    }
                                }
                            }
                        })
                    };

                    let call_summaries_column_id = null;
                    let answer_column_id = null;
                    main();

                    res.status(200).send("ok!")
                } else {
                    res.status(200).send("no integration found for the requsted businessId")
                }
            }
        }
    );
});

app.post('/monday/Webhook', (req, res) => {
    //  console.log('req.body', req.body);
    console.log("Row is - ", req.body?.event?.pulseId);
    console.log("Text is - ", req.body?.event?.value?.text);
    console.log("Changed at - ", req.body?.event?.value?.changed_at);
    res.status(200).send(req.body);
});

// Routes
app.use('/api/boards', boardsRoutes);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


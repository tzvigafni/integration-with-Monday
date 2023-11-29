import {
    Card,
    CardContent,
    CardHeader,
    Grid,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import Button from '@mui/material/Button';

function CardOne({ board, numBoard, setNumBoard }) {

    const [selectedBoard, setSelectedBoard] = useState(null);
    const [boardData, setBoardData] = useState(null);

    const handleBoardClick = async (board) => {
        if (selectedBoard === board) {
            setSelectedBoard(null);
            setBoardData(null);
        } else {
            setSelectedBoard(board);
            try {
                const response = await fetch(`https://monday-integration.serveo.net/api/boards/${board.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }, mode: 'cors'
                }); 
                const data = await response.json();
                console.log(data);
                setBoardData(data); 
            } catch (error) {
                console.error('Error fetching board data:', error);
            }
        }
    };

    const handleSendingConversationSummaries = async (board) => {
        try {
            const response = await fetch(`https://monday-integration.serveo.net/api/boards/saveNumBoard/${board}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }, mode: 'cors'
            }); 
            const data = response.status;
            console.log(data);
            setNumBoard(data);

            setSelectedBoard(null);
            setBoardData(null);

        } catch (error) {
            console.error('Error fetching board data:', error);
        }
    }

    return (
        <Grid item xs={6} sm={4} md={3} >
            <Card sx={{ maxWidth: 200 }} style={{ margin: "20px" }}>
                <CardHeader
                    subheader={board && "name: " + board.name}
                />
                <CardContent>
                    <Button variant="contained"
                        onClick={() => handleBoardClick(board)}>
                        {board && "board id - " + board.id}
                    </Button>
                </CardContent>

                {selectedBoard === board && (
                    <CardContent>
                        {boardData ? (
                            <>
                                {boardData.map(item => <p>Column: {item.title}</p>)}
                                <Button variant="contained"
                                    onClick={() => handleSendingConversationSummaries(board.id)}>
                                    Sending the conversation summaries to this board
                                </Button>
                            </>
                        ) : (
                            <>
                                <Box sx={{ textAlign: 'center' }}>
                                    <p>Loading board data</p>
                                    <CircularProgress />
                                </Box>
                            </>
                        )}
                    </CardContent>
                )}

            </Card>
        </Grid>
    )
}

export default CardOne;
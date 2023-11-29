import { Box, CircularProgress, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import CardOne from "./CardOne";

function AllBoards() {

    const [data, setData] = useState(null);
    const [numBoard, setNumBoard] = useState(null);
    const [errors, setErrors] = useState(null);


    useEffect(() => {
        console.log("get all boards ... ");
        setTimeout(() => {
            fetch(`https://monday-integration.serveo.net/api/boards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }, mode: 'cors'
            })
                .then((res) => res.json())
                .then((data) => {
                    setData(data)
                    console.log("data", data)
                })
                .catch(erroe => {
                    console.log("error --- ", erroe)
                    setErrors(erroe);
                })
        }, 1300)
    }, [])

    return (
        <>
            <br />
            <div style={{ textAlign: 'center' }}>
                <h1 >List Boards</h1>
                <h3>Please select a board where you will receive the call summaries</h3>
            </div>

            {numBoard === 200 && (
                <p style={{ color: 'green', textAlign: 'center', border: '2px green solid', padding: '25px', margin: '40px' }}>
                    Data saved successfully!
                </p>
            )}

            {errors != null && (
                <p style={{ color: 'red', textAlign: 'center', border: '2px red solid', padding: '25px', margin: '40px' }}>
                    Error! try again..
                </p>
            )}

            {data === null && errors === null && (
                <div style={{ color: 'blue', textAlign: 'center', padding: '25px', margin: '40px' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <p>Loading board data</p>
                        <CircularProgress />
                    </Box>
                </div>
            )}

            <Grid container justifyContent="center">
                {data && data.map((board) => (
                    <CardOne key={board.id} board={board} numBoard={numBoard} setNumBoard={setNumBoard} />
                ))}
            </Grid>
        </>
    )
}
export default AllBoards;
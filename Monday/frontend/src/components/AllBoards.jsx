import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import CardOne from "./CardOne";

function AllBoards() {

    const [data, setData] = useState(null);

    const [numBoard, setNumBoard] = useState(null);


    useEffect(() => {
        fetch(`https://c6a6-147-235-79-190.ngrok-free.app/api/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }, mode: 'cors'
        })
            .then((res) => res.json())
            .then((data) => {
                setData(data)
                console.log(data)
            })

    }, []);

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

            <Grid container justifyContent="center">
                {data && data.map((board) => (
                    <CardOne key={board.id} board={board} numBoard={numBoard} setNumBoard={setNumBoard} />
                ))}
            </Grid>
        </>
    )
}
export default AllBoards;
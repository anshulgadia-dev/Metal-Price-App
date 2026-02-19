import dotenv from 'dotenv'
dotenv.config();

import {createServer} from 'http'
import express from 'express'
import helmet from 'helmet';
import cors from 'cors'
import metalPriceRouter from './routes/v1/metal-prices.route.js'
import { Server } from 'socket.io';



const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json());


app.get('/' , (req,res) => {
    res.send('Server is up and running')
})

app.use('/v1' , metalPriceRouter);


const httpServer = createServer(app);
const io = new Server(httpServer ,  {
    cors : {
        origin: '*'
    }
})


io.on('connection' , (socket) => {
    console.log('Client Connected ', socket.id);
    socket.on('disconnect' , () => {
        console.log('Cliend Disconnected ', socket.id);
    });
});

export {io};

const port = process.env.PORT || 3100

httpServer.listen(port , () => {
    console.log(`Server is running on http://localhost:${port}`)
})
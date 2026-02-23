import httpStatus from 'http-status'
import ApiError from '../utils/ApiError.js'
import axios from 'axios';
import dotenv from "dotenv"
dotenv.config()
import redisClient from '../config/redis.js';
import cron from 'node-cron'
import {io} from '../index.js'

const CACHE_KEY = 'metal-prices'
const CACHE_TTL = 60 * 60;


const METAL_PRICE_API = process.env.METAL_PRICE_API;
const METAL_PRICE_API_KEY=process.env.METAL_PRICE_API_KEY;
const METAL_PRICE_API_CURRENCY = process.env.METAL_PRICE_API_CURRENCY || 'USD';
const METAL_PRICE_API_UNIT = process.env.METAL_PRICE_API_UNIT || 'g'

const url = `${METAL_PRICE_API}?api_key=${METAL_PRICE_API_KEY}&currency=${METAL_PRICE_API_CURRENCY}&unit=${METAL_PRICE_API_UNIT}`

// console.log(METAL_PRICE_API)
// cron.schedule('0 */5 * * * *', () => {
//     refreshMetalPrices();
// });



const refreshMetalPrices = async () => {
    try {
        console.log("Cron Job getting metal prices....")
        const freshData = await getMetalPricesFromProvider();

        await setDataToRedis(freshData);
    } catch (error) {
        console.log("Error in Cron Job : " , error)
    }
}

const getMetalPricesFromProvider =  async () => {
    const response = await axios.get(url)
    if(!response.data){
        throw new ApiError(httpStatus.BAD_GATEWAY, 'Invalid response from metal price provider')
    }
    return response.data;   
}


const getMetalPrices = async () => {
    // console.log("I am inside get metal service")

    const cachedData = await redisClient.get(CACHE_KEY);

    if(cachedData){
        console.log("Serving from Redis");
        return JSON.parse(cachedData);
    }


    const freshData = await getMetalPricesFromProvider();

    await setDataToRedis(freshData)
    
    return freshData;   
}

const setDataToRedis =  async (data) => {
    console.log('I am inside setDataToRedis')
    await redisClient.setEx(CACHE_KEY,CACHE_TTL,JSON.stringify(data));
    io.emit('metal-prices-updated' , data)
    // console.log(await redisClient.get(CACHE_KEY))
};

export default {getMetalPrices};
import httpStatus from 'http-status'
// import ApiError from '../utils/ApiError.js'
import CatchAsync from '../utils/CatchAsync.js'
import {metalPriceService} from '../services/index.js'

const getMetalPrices = CatchAsync(async (req,res) => {
    // console.log('I am in get metal prices controller')
    const data = await metalPriceService.getMetalPrices();
    res.status(httpStatus.OK).send(data);
})


export default {getMetalPrices};
import express from 'express'
import {metalPriceController} from '../../controllers/index.js'
const router = express.Router();

router
    .route('/prices')
    .get(metalPriceController.getMetalPrices);


export default router;
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import countriesRouter from "./countries";
import visasRouter from "./visas";

const router: IRouter = Router();

router.use(healthRouter);
router.use(countriesRouter);
router.use(visasRouter);

export default router;

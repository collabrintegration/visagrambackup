import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import countriesRouter from "./countries";
import visasRouter from "./visas";
import communityRouter from "./community";
import supportRouter from "./support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(countriesRouter);
router.use(visasRouter);
router.use(communityRouter);
router.use(supportRouter);

export default router;

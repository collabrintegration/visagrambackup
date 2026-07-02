import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import countriesRouter from "./countries";
import visasRouter from "./visas";
import communityRouter from "./community";
import supportRouter from "./support";
import anthropicRouter from "./anthropic";
import groupsRouter from "./groups";
import visaTrackerRouter from "./visa-tracker";
import directMessagesRouter from "./direct-messages";
import visaGuideRouter from "./visa-guide";
import adminRouter from "./admin";
import friendsRouter from "./friends";
import testimonialsRouter from "./testimonials";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(countriesRouter);
router.use(visasRouter);
router.use(communityRouter);
router.use(supportRouter);
router.use(anthropicRouter);
router.use(groupsRouter);
router.use(visaTrackerRouter);
router.use(directMessagesRouter);
router.use(visaGuideRouter);
router.use(adminRouter);
router.use(friendsRouter);
router.use(testimonialsRouter);

export default router;

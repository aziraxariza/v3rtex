import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);

export default router;

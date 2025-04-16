import { Router } from 'express';
const router = Router();
router.get('/test', (req, res) => {
    res.send("test is working");
});
export default router;

const express = require('express');
const {authMiddleware} = require('../middleware');
const {Account} = require("../db");
const {default: mongoose} = require("mongoose")

const router = express.Router();

router.get("/balance", authMiddleware, async(req,res)=>{
    const account = await Account.findOne({
        userId: req.userId
    });
    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { amount, to } = req.body;

        // Validate amount and recipient
        if (typeof amount !== "number" || amount <= 0 || !to) {
            throw new Error("Invalid amount or recipient");
        }

        // Fetch accounts within the transaction
        const account = await Account.findOne({ userId: req.userId }).session(session);
        if (!account || account.balance < amount) {
            throw new Error("Insufficient balance");
        }

        const toAccount = await Account.findOne({ userId: to }).session(session);
        if (!toAccount) {
            throw new Error("Invalid recipient account");
        }

        // Perform the transfer
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -amount } }
        ).session(session);

        await Account.updateOne(
            { userId: to },
            { $inc: { balance: amount } }
        ).session(session);

        // Commit the transaction
        await session.commitTransaction();
        res.json({ message: "Transfer successful" });
    } catch (error) {
        // Abort the transaction on error
        await session.abortTransaction();
        console.error("Transaction failed:", error);
        res.status(400).json({ message: error.message || "Transaction failed" });
    } finally {
        // End the session
        session.endSession();
    }
});

module.exports = router;
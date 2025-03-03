const express = require('express');
const router = express.Router();
const zod = require("zod");
const { User, Account} = require('../db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const {hashPassword, verifyPassword} = require('./auth_argon2')
const { authMiddleware } = require('../middleware');
const { default: mongoose } = require('mongoose');

const signupSchema = zod.object({
    username: zod.string().min(3).max(30),
    firstName: zod.string().max(50),
    lastName: zod.string().max(50),
    password: zod.string().min(6),
})

//Add the POST route
router.post("/signup", async(req, res) => {
    const body = req.body;

    //validate input using Zod
    const {success} = signupSchema.safeParse(body);
    if (!success) {
        return res.status(411).json({
            message: "Email already taken/ Incorrect Inputs"
        })
    }

    //check if the username is already taken
    const existingUser = await User.findOne({
        username: body.username
    })
    if(existingUser){
        return res.status(409).json({
            message: "Email already taken/ Incorrect Inputs"
        })
    }

    try{
        //hash the password using argon2
        const hashedPassword = await hashPassword(body.password);

        //create the user with their credentials alng with hashed data
        const user = await User.create({
            username: body.username,
            firstName: body.firstName,
            lastName: body.lastName,
            password: hashedPassword
        })

        //generate a JWT toekn
        const userId = user._id;

        // Create a new account for the user
        await Account.create({
            userId,
            balance: 1 + Math.random() * 1000
        })

        const token = jwt.sign({
            userId
        }, JWT_SECRET);

        //Return success Response
        res.json({
            message: "User created successfully",
            token: token
        })
    } catch(err){
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        })
    } 
    
});


const signinSchema = zod.object({
    username: zod.string().min(3).max(30),
    password: zod.string().min(6),
})

//Add the POST route
router.post("/signin", async(req, res) => {
    const body = req.body;

    //Validate input using zod
    const {success} = signinSchema.safeParse(body);
    if (!success){
        return res.status(400).json({
            message: "Incorrect Inputs"
        })
    }

    try{
        //Find the user by username
        const user = await User.findOne({
            username: body.username,
        });
        if (!user) {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }

        //verify hasded password using Argon2
        const isValid = await verifyPassword(user.password, body.password);
        if (!isValid) {
            return res.status(401).json({
                message: "Arong2 verification fail"
            });
        }
        //Generate a JWT token
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);

        //Return success response
        res.json({
            token: token,
        });
    }catch (err){
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
    
})

//zod schema for update validation
const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName : zod.string().optional(),
});

// Add the PUT route
router.put("/", authMiddleware, async(req,res)=>{
    const{success} = updateBody.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Invalid input format"
        });
    }
    try{
        //Hash password if provided, otherwise it will update hashed password as text
        if(req.body.password){
            req.body.password = await hashPassword(req.body.password);
        }
        await User.updateOne({
            _id:req.userId
        },req.body)
        res.json({
            message: "Updated Successfully"
        });
    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
})

router.get("/bulk", async(req,res)=>{
    try{
        const filter = req.query.filter || "";
        const regexFilter = new RegExp(filter, "i"); // case-insensetive search
        const users = await User.find({
            $or: [
                {firstName:{$regex: regexFilter}},
                {lastName:{$regex: regexFilter}},
            ]
        });

        res.json({
            users: users.map(user => ({
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                _id: user._id
            }))
        });
    }catch(err){
        console.error("Error fetching users:", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
})




module.exports = router;
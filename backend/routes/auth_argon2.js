const argon2 = require("argon2");

async function hashPassword(plainTextPassword){
    try{
        const hashedPassword = await argon2.hash(plainTextPassword);
        return hashedPassword;
    } catch(err){
        console.error("Error hashing password from argon2", err);
        throw err;
    }
}

async function verifyPassword(hashedPassword, plainTextPassword){
    try{
        const isValid = await argon2.verify(hashedPassword, plainTextPassword);
        return isValid;
    }catch(err){
        console.error("Error verifying hashing password argon2",err);
        throw err;
    }
}

module.exports = {
    hashPassword,
    verifyPassword
}